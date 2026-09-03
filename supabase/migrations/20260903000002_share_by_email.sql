-- ============================================================
-- Migration: Add email to profiles + lookup function for sharing
-- ============================================================

-- 1. Add email column to profiles (populated by trigger on signup)
alter table public.profiles add column email text;

-- 2. Backfill existing users from auth.users
update public.profiles p
set email = au.email
from auth.users au
where p.id = au.id
  and p.email is null;

-- 3. Make email not null after backfill
alter table public.profiles alter column email set not null;

-- 4. Create unique index on email
create unique index idx_profiles_email on public.profiles (email);

-- 5. RPC function: lookup user ID by email (security definer to access auth.users)
create or replace function public.lookup_user_by_email(lookup_email text)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.profiles
  where lower(email) = lower(lookup_email)
  limit 1;
$$;

grant execute on function public.lookup_user_by_email(text) to authenticated;
revoke execute on function public.lookup_user_by_email(text) from public;
revoke execute on function public.lookup_user_by_email(text) from anon;

-- 6. Update the profile creation trigger to include email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;
