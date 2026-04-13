-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'user' check (role in ('admin', 'creator', 'user')),
  first_name text not null,
  last_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Questions table
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  type text not null check (type in ('open', 'multiple_choice', 'true_false')),
  options jsonb,
  answer text not null,
  explanation text,
  category text not null,
  subcategory text not null,
  difficulty int not null check (difficulty between 1 and 5),
  language text not null default 'EN' check (language in ('HR', 'EN')),
  image_url text,
  status text not null default 'draft' check (status in ('draft', 'approved')),
  creator_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bundles table
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  paddle_price_id text not null unique,
  question_count int not null check (question_count > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Purchases table
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  bundle_id uuid not null references public.bundles(id),
  paddle_transaction_id text unique,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed')),
  category_filter text,
  difficulty_filter int check (difficulty_filter is null or difficulty_filter between 1 and 5),
  created_at timestamptz not null default now()
);

-- User questions junction table
create table public.user_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  question_id uuid not null references public.questions(id),
  purchase_id uuid not null references public.purchases(id),
  created_at timestamptz not null default now(),
  unique(user_id, question_id)
);

-- Indexes
create index idx_questions_category on public.questions(category);
create index idx_questions_difficulty on public.questions(difficulty);
create index idx_questions_status on public.questions(status);
create index idx_questions_creator on public.questions(creator_id);
create index idx_purchases_user on public.purchases(user_id);
create index idx_purchases_status on public.purchases(status);
create index idx_user_questions_user on public.user_questions(user_id);
create index idx_user_questions_question on public.user_questions(question_id);

-- updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger on_questions_updated
  before update on public.questions
  for each row execute function public.handle_updated_at();

create trigger on_bundles_updated
  before update on public.bundles
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Question assignment function (atomic, prevents duplicates)
create or replace function public.assign_questions(
  p_user_id uuid,
  p_purchase_id uuid,
  p_count int,
  p_category text default null,
  p_difficulty int default null
)
returns uuid[] as $$
declare
  v_question_ids uuid[];
begin
  select array_agg(q.id) into v_question_ids
  from (
    select id from public.questions
    where status = 'approved'
      and (p_category is null or category = p_category)
      and (p_difficulty is null or difficulty = p_difficulty)
      and id not in (
        select question_id from public.user_questions where user_id = p_user_id
      )
    order by random()
    limit p_count
    for update skip locked
  ) q;

  if v_question_ids is null or array_length(v_question_ids, 1) < p_count then
    raise exception 'Not enough available questions. Requested: %, Available: %',
      p_count,
      coalesce(array_length(v_question_ids, 1), 0);
  end if;

  insert into public.user_questions (user_id, question_id, purchase_id)
  select p_user_id, unnest(v_question_ids), p_purchase_id;

  update public.purchases set status = 'completed' where id = p_purchase_id;

  return v_question_ids;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.bundles enable row level security;
alter table public.purchases enable row level security;
alter table public.user_questions enable row level security;

-- Helper: get current user's role
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- PROFILES policies
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can do everything on profiles"
  on public.profiles for all
  using (public.get_my_role() = 'admin');

-- QUESTIONS policies
create policy "Anyone can read approved questions"
  on public.questions for select
  using (status = 'approved');

create policy "Creators can read own questions"
  on public.questions for select
  using (creator_id = auth.uid());

create policy "Creators can insert own questions"
  on public.questions for insert
  with check (creator_id = auth.uid() and status = 'draft');

create policy "Creators can update own draft questions"
  on public.questions for update
  using (creator_id = auth.uid() and status = 'draft')
  with check (creator_id = auth.uid() and status = 'draft');

create policy "Admins can do everything on questions"
  on public.questions for all
  using (public.get_my_role() = 'admin');

-- BUNDLES policies
create policy "Anyone can read active bundles"
  on public.bundles for select
  using (is_active = true);

create policy "Admins can do everything on bundles"
  on public.bundles for all
  using (public.get_my_role() = 'admin');

-- PURCHASES policies
create policy "Users can read own purchases"
  on public.purchases for select
  using (user_id = auth.uid());

create policy "Users can insert own purchases"
  on public.purchases for insert
  with check (user_id = auth.uid());

create policy "Admins can do everything on purchases"
  on public.purchases for all
  using (public.get_my_role() = 'admin');

-- USER_QUESTIONS policies
create policy "Users can read own assigned questions"
  on public.user_questions for select
  using (user_id = auth.uid());

create policy "Admins can do everything on user_questions"
  on public.user_questions for all
  using (public.get_my_role() = 'admin');

-- Storage bucket for question images
insert into storage.buckets (id, name, public) values ('question-images', 'question-images', true);

create policy "Authenticated users can upload images"
  on storage.objects for insert
  with check (bucket_id = 'question-images' and auth.role() = 'authenticated');

create policy "Anyone can view question images"
  on storage.objects for select
  using (bucket_id = 'question-images');

create policy "Admins and creators can delete own images"
  on storage.objects for delete
  using (bucket_id = 'question-images' and auth.uid()::text = (storage.foldername(name))[1]);
