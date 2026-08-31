-- ============================================================
-- Migration: shopping lists + members + items
-- Task: 3.3
-- ============================================================

-- 1. Shopping lists table
create table public.shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Shopping list members (who has access)
create table public.shopping_list_members (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.shopping_lists(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  unique (list_id, user_id)
);

-- 3. Shopping list items
create table public.shopping_list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references public.shopping_lists(id) on delete cascade,
  name       text not null,
  quantity   numeric,
  unit       text,
  checked    boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on all three tables
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_members enable row level security;
alter table public.shopping_list_items enable row level security;
