-- Samo admin smije mijenjati is_banned (korisnik ne može sam sebe deblokirati)
create or replace function public.enforce_profile_ban_admin_only()
returns trigger
language plpgsql
as $$
begin
  if new.is_banned is distinct from old.is_banned then
    if auth.uid() is not null and coalesce(public.get_my_role(), '') <> 'admin' then
      raise exception 'Samo administrator može mijenjati status blokade.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profiles_ban_check on public.profiles;
create trigger on_profiles_ban_check
  before update on public.profiles
  for each row
  execute function public.enforce_profile_ban_admin_only();
