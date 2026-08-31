-- ============================================================
-- Migration: recipes + child tables (ingredient groups, ingredients, steps)
-- Task: 3.2
-- ============================================================

-- 1. Recipes table
create table public.recipes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text,
  image_url         text,
  servings          integer not null default 4,
  prep_time_minutes integer,
  cook_time_minutes integer,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. Recipe ingredient groups (e.g., "Chicken", "Sauce")
create table public.recipe_ingredient_groups (
  id        uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name      text not null,
  position  integer not null default 0
);

-- 3. Recipe ingredients (belongs to a group and a recipe)
create table public.recipe_ingredients (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid references public.recipe_ingredient_groups(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  name      text not null,
  quantity  numeric,
  unit      text, -- canonical key: tsp, tbsp, g, kg, ml, l, cup, oz, lb, piece, etc.
  position  integer not null default 0
);

-- 4. Recipe steps
create table public.recipe_steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  instruction text not null,
  position    integer not null default 0
);

-- Enable RLS on all four tables
alter table public.recipes enable row level security;
alter table public.recipe_ingredient_groups enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
