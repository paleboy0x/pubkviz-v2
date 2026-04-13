alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_request_note text;
