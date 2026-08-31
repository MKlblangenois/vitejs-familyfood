-- ============================================================
-- Migration: RLS policies for all tables
-- Task: 3.4
-- Security model:
--   - profiles: own profile read/update; insert via trigger
--   - recipes + children: owner owns all via recipe.user_id
--   - shopping_lists: owner full access; members read/update
--   - shopping_list_members: owner manages; members read
--   - shopping_list_items: owner + members full access
-- ============================================================

-- ==================
-- PROFILES
-- ==================
-- Note: profile deletion handled via auth.users ON DELETE CASCADE (no self-delete policy)

-- Users can view their own profile
create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

-- Users can update their own profile
create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Users can insert their own profile (also handled by trigger, but this allows explicit inserts)
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

-- ==================
-- RECIPES
-- ==================

-- Owner can view their own recipes
create policy "recipes_select_own"
  on public.recipes
  for select
  using (user_id = auth.uid());

-- Owner can insert recipes
create policy "recipes_insert_own"
  on public.recipes
  for insert
  with check (user_id = auth.uid());

-- Owner can update their own recipes
create policy "recipes_update_own"
  on public.recipes
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Owner can delete their own recipes
create policy "recipes_delete_own"
  on public.recipes
  for delete
  using (user_id = auth.uid());

-- ==================
-- RECIPE INGREDIENT GROUPS
-- ==================

-- Owner can manage ingredient groups via recipe ownership
create policy "recipe_ingredient_groups_select_own"
  on public.recipe_ingredient_groups
  for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredient_groups.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredient_groups_insert_own"
  on public.recipe_ingredient_groups
  for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredient_groups.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredient_groups_update_own"
  on public.recipe_ingredient_groups
  for update
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredient_groups.recipe_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredient_groups.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredient_groups_delete_own"
  on public.recipe_ingredient_groups
  for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredient_groups.recipe_id
        and r.user_id = auth.uid()
    )
  );

-- ==================
-- RECIPE INGREDIENTS
-- ==================

-- Owner can manage ingredients via recipe ownership
create policy "recipe_ingredients_select_own"
  on public.recipe_ingredients
  for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_insert_own"
  on public.recipe_ingredients
  for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_update_own"
  on public.recipe_ingredients
  for update
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_ingredients_delete_own"
  on public.recipe_ingredients
  for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.user_id = auth.uid()
    )
  );

-- ==================
-- RECIPE STEPS
-- ==================

-- Owner can manage steps via recipe ownership
create policy "recipe_steps_select_own"
  on public.recipe_steps
  for select
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_insert_own"
  on public.recipe_steps
  for insert
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_update_own"
  on public.recipe_steps
  for update
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id
        and r.user_id = auth.uid()
    )
  );

create policy "recipe_steps_delete_own"
  on public.recipe_steps
  for delete
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_steps.recipe_id
        and r.user_id = auth.uid()
    )
  );

-- ==================
-- SHOPPING LISTS
-- ==================

-- Owner can view lists they own
create policy "shopping_lists_select_owner"
  on public.shopping_lists
  for select
  using (owner_id = auth.uid());

-- Members can view lists they belong to
create policy "shopping_lists_select_member"
  on public.shopping_lists
  for select
  using (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_lists.id
        and m.user_id = auth.uid()
    )
  );

-- Owner can create lists
create policy "shopping_lists_insert_own"
  on public.shopping_lists
  for insert
  with check (owner_id = auth.uid());

-- Owner can update their lists
create policy "shopping_lists_update_own"
  on public.shopping_lists
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Owner can delete their lists
create policy "shopping_lists_delete_own"
  on public.shopping_lists
  for delete
  using (owner_id = auth.uid());

-- ==================
-- SHOPPING LIST MEMBERS
-- ==================

-- Owner can manage members
create policy "shopping_list_members_select_owner"
  on public.shopping_list_members
  for select
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_members.list_id
        and sl.owner_id = auth.uid()
    )
  );

create policy "shopping_list_members_insert_owner"
  on public.shopping_list_members
  for insert
  with check (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_members.list_id
        and sl.owner_id = auth.uid()
    )
  );

create policy "shopping_list_members_delete_owner"
  on public.shopping_list_members
  for delete
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_members.list_id
        and sl.owner_id = auth.uid()
    )
  );

-- Members can see who else is on the list
create policy "shopping_list_members_select_member"
  on public.shopping_list_members
  for select
  using (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_members.list_id
        and m.user_id = auth.uid()
    )
  );

-- ==================
-- SHOPPING LIST ITEMS
-- ==================

-- Owner can manage items on their lists
create policy "shopping_list_items_select_owner"
  on public.shopping_list_items
  for select
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_items.list_id
        and sl.owner_id = auth.uid()
    )
  );

create policy "shopping_list_items_insert_owner"
  on public.shopping_list_items
  for insert
  with check (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_items.list_id
        and sl.owner_id = auth.uid()
    )
  );

create policy "shopping_list_items_update_owner"
  on public.shopping_list_items
  for update
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_items.list_id
        and sl.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_items.list_id
        and sl.owner_id = auth.uid()
    )
  );

create policy "shopping_list_items_delete_owner"
  on public.shopping_list_items
  for delete
  using (
    exists (
      select 1 from public.shopping_lists sl
      where sl.id = shopping_list_items.list_id
        and sl.owner_id = auth.uid()
    )
  );

-- Members can manage items on shared lists
create policy "shopping_list_items_select_member"
  on public.shopping_list_items
  for select
  using (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_items.list_id
        and m.user_id = auth.uid()
    )
  );

create policy "shopping_list_items_insert_member"
  on public.shopping_list_items
  for insert
  with check (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_items.list_id
        and m.user_id = auth.uid()
    )
  );

create policy "shopping_list_items_update_member"
  on public.shopping_list_items
  for update
  using (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_items.list_id
        and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_items.list_id
        and m.user_id = auth.uid()
    )
  );

create policy "shopping_list_items_delete_member"
  on public.shopping_list_items
  for delete
  using (
    exists (
      select 1 from public.shopping_list_members m
      where m.list_id = shopping_list_items.list_id
        and m.user_id = auth.uid()
    )
  );
