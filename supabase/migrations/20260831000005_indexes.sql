-- ============================================================
-- Migration: Indexes and constraints
-- Task: 3.5
-- ============================================================

-- ==================
-- RECIPES
-- ==================

-- Lookup recipes by owner
create index idx_recipes_user_id on public.recipes (user_id);

-- ==================
-- RECIPE INGREDIENT GROUPS
-- ==================

-- Lookup groups by recipe
create index idx_recipe_ingredient_groups_recipe_id on public.recipe_ingredient_groups (recipe_id);

-- ==================
-- RECIPE INGREDIENTS
-- ==================

-- Lookup ingredients by group
create index idx_recipe_ingredients_group_id on public.recipe_ingredients (group_id);

-- Lookup ingredients by recipe (direct query without group join)
create index idx_recipe_ingredients_recipe_id on public.recipe_ingredients (recipe_id);

-- ==================
-- RECIPE STEPS
-- ==================

-- Lookup steps by recipe
create index idx_recipe_steps_recipe_id on public.recipe_steps (recipe_id);

-- ==================
-- SHOPPING LISTS
-- ==================

-- Lookup lists by owner
create index idx_shopping_lists_owner_id on public.shopping_lists (owner_id);

-- ==================
-- SHOPPING LIST MEMBERS
-- ==================

-- Lookup membership by list
create index idx_shopping_list_members_list_id on public.shopping_list_members (list_id);

-- Lookup membership by user (find all lists a user belongs to)
create index idx_shopping_list_members_user_id on public.shopping_list_members (user_id);

-- ==================
-- SHOPPING LIST ITEMS
-- ==================

-- Lookup items by list
create index idx_shopping_list_items_list_id on public.shopping_list_items (list_id);

-- Composite: filter unchecked items on a list (common query)
create index idx_shopping_list_items_list_checked on public.shopping_list_items (list_id, checked);
