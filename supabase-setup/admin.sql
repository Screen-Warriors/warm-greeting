-- =====================================================================
-- NICKY BOY — Admin panel: auth allowlist, RLS, and payment-integrity guard.
-- Run in Supabase Dashboard → SQL Editor. Safe to re-run.
-- =====================================================================

-- ---------- admin_users allowlist ----------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text,
  created_at  timestamptz not null default now()
);

grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;

alter table public.admin_users enable row level security;

drop policy if exists "admins can read allowlist" on public.admin_users;
create policy "admins can read allowlist" on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- ---------- is_admin() SECURITY DEFINER ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
$$;

grant execute on function public.is_admin() to authenticated;

-- ---------- New order columns for fulfillment ----------
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists admin_notes text;

-- ---------- Admin RLS on orders ----------
grant select, update on public.orders to authenticated;

drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders" on public.orders
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update orders" on public.orders;
create policy "admins update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Trigger: block payment field mutation via admin path ----------
create or replace function public.orders_admin_guard()
returns trigger language plpgsql as $$
begin
  -- service_role bypasses RLS and is allowed to touch payment fields (Edge Functions).
  -- Non-service roles must not modify payment integrity fields, subtotal, or total.
  if current_setting('role', true) <> 'service_role' then
    if new.razorpay_order_id   is distinct from old.razorpay_order_id
    or new.razorpay_payment_id is distinct from old.razorpay_payment_id
    or new.razorpay_signature  is distinct from old.razorpay_signature
    or new.payment_status      is distinct from old.payment_status
    or new.payment_method      is distinct from old.payment_method
    or new.subtotal            is distinct from old.subtotal
    or new.total               is distinct from old.total
    or new.discount            is distinct from old.discount
    or new.cod_fee             is distinct from old.cod_fee
    or new.shipping            is distinct from old.shipping
    or new.items               is distinct from old.items
    then
      raise exception 'payment/order integrity fields are immutable from the admin panel';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_admin_guard on public.orders;
create trigger trg_orders_admin_guard
  before update on public.orders
  for each row execute function public.orders_admin_guard();

-- ---------- Admin RLS on products ----------
grant select, insert, update, delete on public.products to authenticated;

drop policy if exists "admins full products" on public.products;
create policy "admins full products" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Admin RLS on reviews (moderation) ----------
grant update, delete on public.reviews to authenticated;

drop policy if exists "admins read all reviews" on public.reviews;
create policy "admins read all reviews" on public.reviews
  for select to authenticated using (public.is_admin());

drop policy if exists "admins update reviews" on public.reviews;
create policy "admins update reviews" on public.reviews
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins delete reviews" on public.reviews;
create policy "admins delete reviews" on public.reviews
  for delete to authenticated using (public.is_admin());

-- ---------- Admin RLS on newsletter_signups ----------
grant select on public.newsletter_signups to authenticated;

drop policy if exists "admins read newsletter" on public.newsletter_signups;
create policy "admins read newsletter" on public.newsletter_signups
  for select to authenticated using (public.is_admin());

-- ---------- Storage bucket for product images ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "public read product images" on storage.objects;
create policy "public read product images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');

drop policy if exists "admins write product images" on storage.objects;
create policy "admins write product images" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());
