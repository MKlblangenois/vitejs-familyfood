-- ============================================================
-- Migration: Fix RLS infinite recursion on shopping_list_members
-- Bug: member policies on shopping_lists, shopping_list_members,
--      and shopping_list_items used inline subqueries on
--      shopping_list_members, causing mutual/self recursion.
-- Fix: create a security-definer helper that checks membership
--      without triggering RLS, then rewrite the 6 member policies.
-- ============================================================

-- 1. Create the helper function (idempotent)
create or replace function public.is_list_member(list_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.shopping_list_members m
    where m.list_id = $1
      and m.user_id = auth.uid()
  );
$$;

-- 2. Grant EXECUTE to authenticated only (RLS policies run as requesting role).
--    Revoke the default PUBLIC grant and anon so the security-definer function
--    is NOT exposed via /rest/v1/rpc/is_list_member to unauthenticated users.
grant execute on function public.is_list_member(uuid) to authenticated;
revoke execute on function public.is_list_member(uuid) from public;
revoke execute on function public.is_list_member(uuid) from anon;

-- 3. Drop + recreate the 6 member policies using the helper

-- shopping_lists: member can view lists they belong to
drop policy if exists "shopping_lists_select_member" on public.shopping_lists;
create policy "shopping_lists_select_member"
  on public.shopping_lists
  for select
  using (public.is_list_member(shopping_lists.id));

-- shopping_list_members: members can see who else is on the list
drop policy if exists "shopping_list_members_select_member" on public.shopping_list_members;
create policy "shopping_list_members_select_member"
  on public.shopping_list_members
  for select
  using (public.is_list_member(shopping_list_members.list_id));

-- shopping_list_items: member can read items on shared lists
drop policy if exists "shopping_list_items_select_member" on public.shopping_list_items;
create policy "shopping_list_items_select_member"
  on public.shopping_list_items
  for select
  using (public.is_list_member(shopping_list_items.list_id));

-- shopping_list_items: member can add items to shared lists
drop policy if exists "shopping_list_items_insert_member" on public.shopping_list_items;
create policy "shopping_list_items_insert_member"
  on public.shopping_list_items
  for insert
  with check (public.is_list_member(shopping_list_items.list_id));

-- shopping_list_items: member can update items on shared lists
drop policy if exists "shopping_list_items_update_member" on public.shopping_list_items;
create policy "shopping_list_items_update_member"
  on public.shopping_list_items
  for update
  using (public.is_list_member(shopping_list_items.list_id))
  with check (public.is_list_member(shopping_list_items.list_id));

-- shopping_list_items: member can delete items on shared lists
drop policy if exists "shopping_list_items_delete_member" on public.shopping_list_items;
create policy "shopping_list_items_delete_member"
  on public.shopping_list_items
  for delete
  using (public.is_list_member(shopping_list_items.list_id));
