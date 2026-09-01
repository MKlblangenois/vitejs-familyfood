-- ============================================================
-- Migration: Seed data
-- Task: 3.8
--
-- HOW TO RUN:
--   Option A (Supabase CLI): supabase db reset
--   Option B (Dashboard): Copy-paste into SQL Editor and run
--   Option C (psql): psql -f supabase/migrations/20260831000007_seed.sql
--
-- TEST CREDENTIALS:
--   User 1 (Owner):
--     Email:    alice@example.com
--     Password: Password123!
--     Display:  Alice
--
--   User 2 (Collaborator):
--     Email:    bob@example.com
--     Password: Password123!
--     Display:  Bob
--
-- NOTE: Password hashes are generated at seed time via crypt('Password123!', gen_salt('bf', 10))
--       to guarantee the hash matches the documented password.
--       If these don't work, create users via the Supabase Dashboard
--       or admin API and replace the UUIDs below.
-- ============================================================

-- Ensure pgcrypto is available for crypt()/gen_salt() (Supabase includes it by default)
create extension if not exists pgcrypto;

-- ==================
-- 1. Create test users in auth.users
-- ==================

-- Password hash for "Password123!" generated at seed time via crypt()
-- NOTE: On Supabase, auth.users inserts require specific columns.
-- If direct insert fails, use the Dashboard or admin API to create these users,
-- then update the UUIDs below to match.

-- User 1: Alice
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  confirmation_token
) values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '00000000-0000-0000-0000-000000000000',
  'alice@example.com',
  crypt('Password123!', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"display_name": "Alice"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- User 2: Bob
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data,
  role,
  aud,
  confirmation_token
) values (
  'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d',
  '00000000-0000-0000-0000-000000000000',
  'bob@example.com',
  crypt('Password123!', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"display_name": "Bob"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  'authenticated',
  'authenticated',
  ''
) on conflict (id) do nothing;

-- ==================
-- 2. Create profiles (will also be created by trigger, but explicit for safety)
-- ==================

insert into public.profiles (id, display_name) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice'),
  ('b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', 'Bob')
on conflict (id) do update set display_name = excluded.display_name;

-- ==================
-- 3. Create recipes for User 1 (Alice)
-- ==================

-- Recipe 1: Garlic Parmesan Chicken (primary test case)
insert into public.recipes (
  id, user_id, title, description, servings, prep_time_minutes, cook_time_minutes
) values (
  'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Garlic Parmesan Chicken',
  'Crispy baked chicken thighs coated in a buttery garlic parmesan sauce. Simple, flavorful, and ready in under 30 minutes.',
  4,
  10,
  20
);

-- Ingredient groups
insert into public.recipe_ingredient_groups (id, recipe_id, name, position) values
  ('a1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Chicken', 0),
  ('a2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Garlic Parmesan Sauce', 1);

-- Ingredients: Chicken group
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'bone-in chicken thighs', 8, 'piece', 0),
  ('a1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'salt', 1, 'tsp', 1),
  ('a1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'black pepper', 0.5, 'tsp', 2);

-- Ingredients: Garlic Parmesan Sauce group
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'unsalted butter', 4, 'tbsp', 0),
  ('a2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'garlic cloves, minced', 6, 'piece', 1),
  ('a2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'grated parmesan', 0.5, 'cup', 2),
  ('a2a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'fresh parsley, chopped', 2, 'tbsp', 3);

-- Steps
insert into public.recipe_steps (recipe_id, instruction, position) values
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Preheat oven to 425 F (220 C). Pat chicken thighs dry and season with salt and pepper.', 0),
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Heat an oven-safe skillet over medium-high heat. Sear chicken skin-side down for 5 minutes until golden. Flip and cook 2 more minutes. Set aside.', 1),
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'In the same skillet, melt butter. Add minced garlic and cook for 1 minute until fragrant. Stir in parmesan.', 2),
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Return chicken to the skillet, spooning garlic parmesan sauce over each thigh.', 3),
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Bake for 18-20 minutes until chicken reaches 165 F (74 C) internal temperature.', 4),
  ('c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'Garnish with fresh parsley and serve immediately.', 5);

-- Recipe 2: Creamy Tomato Pasta
insert into public.recipes (
  id, user_id, title, description, servings, prep_time_minutes, cook_time_minutes
) values (
  'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Creamy Tomato Pasta',
  'A rich and velvety tomato pasta with a touch of cream. Ready in 20 minutes and perfect for busy weeknights.',
  4,
  5,
  15
);

-- Ingredient groups
insert into public.recipe_ingredient_groups (id, recipe_id, name, position) values
  ('a3b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Pasta', 0),
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Sauce', 1);

-- Ingredients: Pasta
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a3b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'penne pasta', 400, 'g', 0);

-- Ingredients: Sauce
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'olive oil', 2, 'tbsp', 0),
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'garlic cloves, minced', 3, 'piece', 1),
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'crushed tomatoes', 400, 'ml', 2),
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'heavy cream', 120, 'ml', 3),
  ('a4b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'd2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'fresh basil leaves', 6, 'piece', 4);

-- Steps
insert into public.recipe_steps (recipe_id, instruction, position) values
  ('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Cook penne in salted boiling water until al dente. Reserve 1 cup pasta water before draining.', 0),
  ('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Heat olive oil in a large pan. Saut garlic for 30 seconds until fragrant.', 1),
  ('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Add crushed tomatoes, salt, and pepper. Simmer for 8 minutes, stirring occasionally.', 2),
  ('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Stir in heavy cream and torn basil leaves. Cook for 2 more minutes.', 3),
  ('d2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'Toss in cooked penne. Add pasta water a splash at a time to reach desired consistency.', 4);

-- Recipe 3: Chocolate Chip Cookies
insert into public.recipes (
  id, user_id, title, description, servings, prep_time_minutes, cook_time_minutes
) values (
  'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Chocolate Chip Cookies',
  'Classic chewy chocolate chip cookies with crispy edges. Makes about 24 cookies.',
  24,
  15,
  12
);

-- Ingredient groups
insert into public.recipe_ingredient_groups (id, recipe_id, name, position) values
  ('a5c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Dry Ingredients', 0),
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Wet Ingredients', 1);

-- Ingredients: Dry
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a5c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'all-purpose flour', 2.25, 'cup', 0),
  ('a5c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'baking soda', 1, 'tsp', 1),
  ('a5c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'salt', 1, 'tsp', 2),
  ('a5c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'semisweet chocolate chips', 2, 'cup', 3);

-- Ingredients: Wet
insert into public.recipe_ingredients (group_id, recipe_id, name, quantity, unit, position) values
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'unsalted butter, softened', 1, 'cup', 0),
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'granulated sugar', 0.75, 'cup', 1),
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'brown sugar, packed', 0.75, 'cup', 2),
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'large eggs', 2, 'piece', 3),
  ('a6c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'vanilla extract', 1, 'tsp', 4);

-- Steps
insert into public.recipe_steps (recipe_id, instruction, position) values
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Preheat oven to 375 F (190 C). Line baking sheets with parchment paper.', 0),
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Whisk flour, baking soda, and salt in a bowl. Set aside.', 1),
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Beat butter and both sugars until light and fluffy (about 3 minutes). Beat in eggs one at a time, then vanilla.', 2),
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Gradually mix in the dry ingredients until just combined. Fold in chocolate chips.', 3),
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Scoop tablespoon-sized balls onto prepared sheets, spacing 2 inches apart.', 4),
  ('e3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'Bake 10-12 minutes until edges are golden but centers look slightly underdone. Cool on sheets 5 minutes.', 5);

-- ==================
-- 4. Shopping lists for User 1 (Alice)
-- ==================

-- Shopping list 1: Weekly Groceries
insert into public.shopping_lists (id, owner_id, title) values
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Weekly Groceries');

-- Add Bob as editor
insert into public.shopping_list_members (list_id, user_id, role) values
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', 'editor');

-- Items
insert into public.shopping_list_items (list_id, name, quantity, unit, checked, created_by) values
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'bone-in chicken thighs', 8, 'piece', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'garlic', 2, 'piece', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'grated parmesan', 1, 'cup', false, 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'unsalted butter', 1, 'cup', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'fresh parsley', 1, 'piece', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'heavy cream', 240, 'ml', false, 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d');

-- Shopping list 2: Weekend BBQ
insert into public.shopping_lists (id, owner_id, title) values
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Weekend BBQ');

-- Only Alice on this one
insert into public.shopping_list_members (list_id, user_id, role) values
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'owner');

-- Items
insert into public.shopping_list_items (list_id, name, quantity, unit, checked, created_by) values
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'chicken drumsticks', 12, 'piece', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'bbq sauce', 1, 'l', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'coleslaw mix', 1, 'bag', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'hamburger buns', 8, 'piece', true, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90', 'ground beef', 900, 'g', false, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
