-- ============================================================
-- Migration: loyalty cards + members (sharing)
-- Feature: loyalty card wallet with barcode display and sharing
-- ============================================================

-- 1. Loyalty cards table
create table public.loyalty_cards (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  store_name     text not null,
  barcode_value  text,
  barcode_format text,
  card_color     text not null default '#1f3a2e',
  logo_url       text,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 2. Loyalty card members (who has access to a shared card)
create table public.loyalty_card_members (
  id         uuid primary key default gen_random_uuid(),
  card_id    uuid not null references public.loyalty_cards(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  unique (card_id, user_id)
);

-- Enable RLS on both tables
alter table public.loyalty_cards enable row level security;
alter table public.loyalty_card_members enable row level security;

-- ==================
-- LOYALTY CARD MEMBER HELPER
-- ==================

-- security-definer function: checks membership without triggering RLS
create or replace function public.is_card_member(card_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.loyalty_card_members m
    where m.card_id = $1
      and m.user_id = auth.uid()
  );
$$;

-- Grant EXECUTE only to authenticated (RLS policies run as the requesting role).
-- Revoke the default PUBLIC grant and anon so the security-definer function
-- is NOT exposed via /rest/v1/rpc/is_card_member to unauthenticated users.
grant execute on function public.is_card_member(uuid) to authenticated;
revoke execute on function public.is_card_member(uuid) from public;
revoke execute on function public.is_card_member(uuid) from anon;

-- ==================
-- LOYALTY CARDS
-- ==================

-- Owner can view their own cards
create policy "loyalty_cards_select_own"
  on public.loyalty_cards
  for select
  using (user_id = auth.uid());

-- Members can view shared cards
create policy "loyalty_cards_select_member"
  on public.loyalty_cards
  for select
  using (public.is_card_member(loyalty_cards.id));

-- Owner can create cards
create policy "loyalty_cards_insert_own"
  on public.loyalty_cards
  for insert
  with check (user_id = auth.uid());

-- Owner can update their cards
create policy "loyalty_cards_update_own"
  on public.loyalty_cards
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Owner can delete their cards
create policy "loyalty_cards_delete_own"
  on public.loyalty_cards
  for delete
  using (user_id = auth.uid());

-- ==================
-- LOYALTY CARD MEMBERS
-- ==================

-- Owner can view members of their cards
create policy "loyalty_card_members_select_own"
  on public.loyalty_card_members
  for select
  using (
    exists (
      select 1 from public.loyalty_cards lc
      where lc.id = loyalty_card_members.card_id
        and lc.user_id = auth.uid()
    )
  );

-- Owner can add members
create policy "loyalty_card_members_insert_own"
  on public.loyalty_card_members
  for insert
  with check (
    exists (
      select 1 from public.loyalty_cards lc
      where lc.id = loyalty_card_members.card_id
        and lc.user_id = auth.uid()
    )
  );

-- Owner can remove members
create policy "loyalty_card_members_delete_own"
  on public.loyalty_card_members
  for delete
  using (
    exists (
      select 1 from public.loyalty_cards lc
      where lc.id = loyalty_card_members.card_id
        and lc.user_id = auth.uid()
    )
  );

-- Members can see who else has access to the card
create policy "loyalty_card_members_select_member"
  on public.loyalty_card_members
  for select
  using (public.is_card_member(loyalty_card_members.card_id));

-- ==================
-- INDEXES
-- ==================

-- Lookup cards by owner
create index idx_loyalty_cards_user_id on public.loyalty_cards (user_id);

-- Lookup membership by card
create index idx_loyalty_card_members_card_id on public.loyalty_card_members (card_id);

-- Lookup membership by user (find all cards a user belongs to)
create index idx_loyalty_card_members_user_id on public.loyalty_card_members (user_id);

-- ==================
-- UPDATED_AT TRIGGER
-- ==================

create trigger trg_loyalty_cards_updated_at
  before update on public.loyalty_cards
  for each row
  execute function public.set_updated_at();
