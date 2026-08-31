-- ============================================================
-- Migration: Generic updated_at trigger
-- Task: 3.6
-- ============================================================

-- 1. Generic trigger function: sets updated_at to now() on every UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. Apply trigger to all tables with updated_at columns
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger trg_recipes_updated_at
  before update on public.recipes
  for each row
  execute function public.set_updated_at();

create trigger trg_shopping_lists_updated_at
  before update on public.shopping_lists
  for each row
  execute function public.set_updated_at();

create trigger trg_shopping_list_items_updated_at
  before update on public.shopping_list_items
  for each row
  execute function public.set_updated_at();
