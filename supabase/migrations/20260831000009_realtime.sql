-- ============================================================
-- Migration: Enable Realtime for shopping lists
-- Task: Phase 8
--
-- Supabase Realtime only delivers changes for tables that are
-- members of the `supabase_realtime` publication. Without this,
-- collaborative shopping-list edits would never reach other
-- clients. Add both tables so item and list changes stream live.
--
-- Each `alter publication ... add table` is wrapped in a guard so
-- the migration is idempotent-safe: re-running it won't fail when
-- a table is already a member of the publication.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_lists'
  ) then
    alter publication supabase_realtime add table public.shopping_lists;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_list_items'
  ) then
    alter publication supabase_realtime add table public.shopping_list_items;
  end if;
end $$;
