-- ============================================================================
-- Brings this database's `orders` RLS in line with the vercel copy: adds the
-- policy that lets a user cancel their OWN order, but only while it's still
-- "pending" (can't cancel something already paid/failed), and only ever lands
-- it in the "cancelled" state (can't use this policy to fake a "paid" row).
-- This is what the app's new Cancel button on the Dashboard depends on.
-- Run this with: supabase db push   (or paste into the Supabase SQL editor)
-- ============================================================================

create policy "Users can cancel their own pending orders"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');
