# Tablee — Supabase Migrations

SQL migrations for the Tablee cooking app database schema, RLS policies, and seed data.

## Structure

```
supabase/
  config.toml                          # Supabase CLI configuration
  migrations/
    20260831000001_profiles.sql        # Profiles table + auto-create trigger
    20260831000002_recipes.sql         # Recipes + ingredient groups + ingredients + steps
    20260831000003_shopping_lists.sql  # Shopping lists + members + items
    20260831000004_rls_policies.sql    # Row Level Security policies for all tables
    20260831000005_indexes.sql         # Performance indexes on foreign keys
    20260831000006_updated_at_triggers.sql  # Auto-update timestamps
    20260831000007_seed.sql            # Test data (users, recipes, shopping lists)
  tests/
    rls_tests.sql                      # RLS policy assertion tests
```

## Applying Migrations

### Option A: Supabase CLI (recommended)

```bash
# Initialize Supabase (first time only)
supabase init

# Link to your project (after creating on supabase.com)
supabase link --project-ref <your-project-id>

# Push all migrations
supabase db push

# Or reset the database (applies all migrations from scratch)
supabase db reset
```

### Option B: Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run each migration file in order (001 through 007)
4. Skip 008 (tests) unless running the test suite

### Option C: psql

```bash
psql "postgresql://postgres:<password>@<host>:5432/postgres" \
  -f supabase/migrations/20260831000001_profiles.sql \
  -f supabase/migrations/20260831000002_recipes.sql \
  -f supabase/migrations/20260831000003_shopping_lists.sql \
  -f supabase/migrations/20260831000004_rls_policies.sql \
  -f supabase/migrations/20260831000005_indexes.sql \
  -f supabase/migrations/20260831000006_updated_at_triggers.sql \
  -f supabase/migrations/20260831000007_seed.sql
```

## Generating TypeScript Types

After migrations are applied:

```bash
# Via Supabase CLI
supabase gen types typescript --local > src/types/database.ts

# Or from a linked remote project
supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

## Seed Data

The seed migration (`000007_seed.sql`) creates:

| User  | Email              | Password    |
|-------|--------------------|-------------|
| Alice | alice@example.com  | Password123! |
| Bob   | bob@example.com    | Password123! |

**Alice** has 3 recipes and 2 shopping lists. **Bob** is an editor on one of Alice's lists.

See `000007_seed.sql` for full details including recipe ingredients and shopping list items.

## Running RLS Tests

The test file (`tests/rls_tests.sql`) verifies Row Level Security policies. Run after applying all migrations:

```bash
# Via psql
psql "postgresql://postgres:<password>@<host>:5432/postgres" \
  -f supabase/tests/rls_tests.sql
```

Tests use `set local role` and `set request.jwt.claim.sub` to simulate different users and verify:
- Unauthenticated users see nothing
- Users can only see their own data
- Members can access shared lists
- Non-members are blocked from private lists
- Users cannot insert records as other users

## Schema Summary

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (auto-created on signup) |
| `recipes` | Recipe headers (title, description, servings, times) |
| `recipe_ingredient_groups` | Named groups within a recipe (e.g., "Chicken", "Sauce") |
| `recipe_ingredients` | Individual ingredients with quantity/unit/position |
| `recipe_steps` | Numbered cooking instructions |
| `shopping_lists` | Collaborative shopping list headers |
| `shopping_list_members` | List membership with roles (owner/editor) |
| `shopping_list_items` | Individual items with checked state |

### Security Model

- **RLS is enabled** on every table
- **Recipes**: Owner-only access (all operations)
- **Recipe children**: Access follows recipe ownership via foreign key joins
- **Shopping lists**: Owner has full access; members can view and update
- **Profiles**: Users can only read/update their own profile
