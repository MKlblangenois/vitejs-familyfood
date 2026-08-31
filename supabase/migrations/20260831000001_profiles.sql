-- ============================================================
-- Migration: profiles table + auto-create profile trigger
-- Tasks: 3.1 (profiles table) + 2.7 (auto-create on signup)
-- ============================================================

-- 1. Profiles table
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- 2. Trigger function: auto-create profile on auth.users insert
--    Uses display_name from raw_user_meta_data, falls back to email prefix, then 'User'
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  display_name_val text;
begin
  -- Extract display_name from metadata, falling back to email prefix or 'User'
  display_name_val :=
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1),
      'User'
    );

  insert into public.profiles (id, display_name)
  values (new.id, display_name_val);

  return new;
end;
$$;

-- 3. Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
