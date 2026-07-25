-- ============================================================================
-- Fixes: (1) orders had no payment-status field, so download links were
--            granted the instant an order row existed — before payment was
--            ever confirmed. (2) carts / featured_products had RLS either
--            disabled or enabled-with-no-policies, leaving them open (or in
--            an inconsistent state) to the public anon key.
-- Run this with: supabase db push   (or paste into the SQL editor)
-- ============================================================================

-- 1. Track real payment status on orders -------------------------------------
alter table public.orders
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled'));

-- Links a DB order to the PayMongo checkout session that was created for it,
-- so the webhook can find the right row to update.
alter table public.orders
  add column if not exists checkout_session_id text;

create index if not exists orders_checkout_session_id_idx
  on public.orders (checkout_session_id);

-- Existing rows predate payment tracking — assume they were already paid so
-- current customers don't lose access to downloads they already have.
update public.orders set status = 'paid' where status = 'pending';

-- 2. Lock down carts and featured_products -----------------------------------
-- Neither table is used by the current app code. Enabling RLS with no
-- policies denies all access via the public anon/authenticated API keys,
-- while the service-role key (used only in trusted server-side code) still
-- has full access. If you start using `carts` for server-side cart storage,
-- add explicit owner-scoped policies (auth.uid() = user_id) at that time.
alter table public.carts enable row level security;
alter table public.featured_products enable row level security;

-- featured_products mirrors "products" in intent (public marketing data), so
-- give it the same public-read policy products already has, without opening
-- up writes.
create policy "Allow public read access to featured_products"
  on public.featured_products
  for select
  to public
  using (true);