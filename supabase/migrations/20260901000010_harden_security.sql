-- ============================================================
-- Migration: Harden function security + add missing index
-- Applied directly to live project via MCP (2026-09-01)
-- 1. set_updated_at: pin search_path (advisors: function_search_path_mutable)
-- 2. handle_new_user: revoke EXECUTE from anon/authenticated/public
--    (trigger-only SECURITY DEFINER function; must not be callable via RPC)
-- 3. Add missing index on shopping_list_items.created_by FK
--    (advisors: unindexed_foreign_keys)
-- ============================================================

-- 1. set_updated_at: pin search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. handle_new_user: revoke EXECUTE from API roles + PUBLIC
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- 3. Missing index on shopping_list_items.created_by FK
create index idx_shopping_list_items_created_by
  on public.shopping_list_items (created_by);
