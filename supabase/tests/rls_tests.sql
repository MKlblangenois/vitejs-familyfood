-- ============================================================
-- RLS Policy Tests
-- Task: 3.9
--
-- PURPOSE: Verify that Row Level Security correctly denies
-- unauthorized access across all tables.
--
-- HOW TO RUN:
--   Option A: supabase db test (if configured)
--   Option B: Copy into SQL Editor with test users created first
--   Option C: psql with role switching
--
-- PREREQUISITES:
--   - All migrations (001-007) must be applied
--   - Test users must exist:
--       Alice: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
--       Bob:   b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d
--
-- APPROACH:
--   Each test simulates a user context using:
--     set local role 'authenticated';
--     set request.jwt.claim.sub = '<user-uuid>';
--
--   Then attempts a query that should either succeed or fail.
--   Uses ASSERT or RAISE NOTICE to report results.
-- ============================================================

-- ============================================================
-- TEST 1: Unauthenticated user cannot select recipes
-- ============================================================

-- Simulate unauthenticated (no JWT)
set local role 'postgres';

-- This should return 0 rows because there's no auth.uid()
do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);

  select count(*) into row_count
  from public.recipes
  where user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count = 0 then
    raise notice 'PASS: unauthenticated cannot see Alice recipes (got 0 rows)';
  else
    raise notice 'FAIL: unauthenticated saw % rows of Alice recipes', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 2: Alice can see her own recipes
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

  select count(*) into row_count
  from public.recipes
  where user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count = 3 then
    raise notice 'PASS: Alice can see her 3 recipes';
  else
    raise notice 'FAIL: Alice expected 3 recipes, got %', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 3: Bob cannot see Alice's recipes
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  select count(*) into row_count
  from public.recipes
  where user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count = 0 then
    raise notice 'PASS: Bob cannot see Alice recipes (RLS blocks cross-user access)';
  else
    raise notice 'FAIL: Bob saw % of Alice recipes', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 4: Bob cannot see Alice's recipe ingredients
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  select count(*) into row_count
  from public.recipe_ingredients ri
  join public.recipes r on r.id = ri.recipe_id
  where r.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count = 0 then
    raise notice 'PASS: Bob cannot see Alice recipe ingredients';
  else
    raise notice 'FAIL: Bob saw % of Alice recipe ingredients', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 5: Alice can see her own recipe ingredients
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

  select count(*) into row_count
  from public.recipe_ingredients ri
  join public.recipes r on r.id = ri.recipe_id
  where r.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count > 0 then
    raise notice 'PASS: Alice can see her recipe ingredients (% rows)', row_count;
  else
    raise notice 'FAIL: Alice cannot see her own recipe ingredients';
  end if;
end $$;

-- ============================================================
-- TEST 6: Bob (member) can see shared shopping list
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  select count(*) into row_count
  from public.shopping_lists sl
  where sl.id = 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f'; -- Weekly Groceries

  if row_count = 1 then
    raise notice 'PASS: Bob (member) can see the shared Weekly Groceries list';
  else
    raise notice 'FAIL: Bob expected 1 shared list, got %', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 7: Bob (member) can see items on shared list
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  select count(*) into row_count
  from public.shopping_list_items
  where list_id = 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f';

  if row_count = 6 then
    raise notice 'PASS: Bob sees all 6 items on shared list';
  else
    raise notice 'FAIL: Bob expected 6 items, got %', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 8: Bob cannot see Alice's private shopping list (Weekend BBQ)
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  select count(*) into row_count
  from public.shopping_lists sl
  where sl.id = 'a5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90'; -- Weekend BBQ

  if row_count = 0 then
    raise notice 'PASS: Bob cannot see Alice private Weekend BBQ list';
  else
    raise notice 'FAIL: Bob saw Alice private list (count: %)', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 9: Alice can see both her shopping lists
-- ============================================================

do $$
declare
  row_count integer;
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

  select count(*) into row_count
  from public.shopping_lists
  where owner_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  if row_count = 2 then
    raise notice 'PASS: Alice can see her 2 shopping lists';
  else
    raise notice 'FAIL: Alice expected 2 lists, got %', row_count;
  end if;
end $$;

-- ============================================================
-- TEST 10: Bob cannot insert into Alice's recipes
-- ============================================================

do $$
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', true);

  begin
    insert into public.recipes (user_id, title, servings)
    values ('b1f4c2d3-e4a5-4f6b-8c7d-9e0f1a2b3c4d', 'Unauthorized Recipe', 4);
    raise notice 'PASS: Bob can insert his own recipe (expected)';

    -- Clean up Bob's test recipe
    delete from public.recipes where title = 'Unauthorized Recipe';
  exception when others then
    raise notice 'FAIL: Bob cannot insert his own recipe — %', sqlerrm;
  end;

  -- Try to insert with Alice's user_id (should fail with RLS)
  begin
    insert into public.recipes (user_id, title, servings)
    values ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Fake Alice Recipe', 4);
    raise notice 'FAIL: Bob should not be able to insert recipe as Alice';
  exception when others then
    raise notice 'PASS: RLS correctly denied Bob inserting recipe as Alice';
  end;
end $$;

-- ============================================================
-- TEST 11: Alice can insert recipe as herself
-- ============================================================

do $$
begin
  set local role 'authenticated';
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claim.sub', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true);

  begin
    insert into public.recipes (user_id, title, servings)
    values ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Alice Test Recipe', 4);
    raise notice 'PASS: Alice can insert her own recipe';

    -- Clean up
    delete from public.recipes where title = 'Alice Test Recipe';
  exception when others then
    raise notice 'FAIL: Alice cannot insert her own recipe — %', sqlerrm;
  end;
end $$;

-- ============================================================
-- TEST 12: Cleanup - restore role
-- ============================================================

set local role 'postgres';

do $$
begin
  raise notice '--- All RLS tests complete ---';
end $$;
