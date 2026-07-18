-- =====================================================================
-- NICKY BOY — Full schema, RLS, grants, and seed data.
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  name              text not null,
  description       text,
  price             integer not null,
  compare_at_price  integer,
  currency          text not null default 'INR',
  sizes             text[] not null default '{}',
  colors            jsonb not null default '[]'::jsonb,
  images            text[] not null default '{}',
  stock_by_size     jsonb not null default '{}'::jsonb,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select to anon, authenticated using (is_active = true);

-- ---------- ORDERS ----------
do $$ begin
  create type public.order_status as enum ('pending','paid','failed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  customer_name         text not null,
  email                 text not null,
  phone                 text not null,
  shipping_address      jsonb not null,
  items                 jsonb not null,
  subtotal              integer not null,
  shipping              integer not null default 0,
  total                 integer not null,
  currency              text not null default 'INR',
  status                public.order_status not null default 'pending',
  razorpay_order_id     text unique,
  razorpay_payment_id   text,
  razorpay_signature    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists orders_razorpay_order_id_idx on public.orders(razorpay_order_id);
create index if not exists orders_email_idx on public.orders(email);

-- Fully sealed from the client. Only Edge Functions (service_role) touch this table.
grant all on public.orders to service_role;
alter table public.orders enable row level security;
-- No policies for anon/authenticated => zero client access.

-- ---------- REVIEWS ----------
create table if not exists public.reviews (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  reviewer_name  text not null,
  city           text,
  rating         smallint not null check (rating between 1 and 5),
  title          text,
  comment        text not null,
  image_url      text,
  is_approved    boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists reviews_product_approved_idx
  on public.reviews(product_id, is_approved, created_at desc);

grant select, insert on public.reviews to anon, authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
drop policy if exists "public read approved reviews" on public.reviews;
create policy "public read approved reviews" on public.reviews
  for select to anon, authenticated using (is_approved = true);
drop policy if exists "anyone can submit a review" on public.reviews;
create policy "anyone can submit a review" on public.reviews
  for insert to anon, authenticated with check (is_approved = false);

-- ---------- NEWSLETTER ----------
create table if not exists public.newsletter_signups (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  created_at  timestamptz not null default now()
);
grant insert on public.newsletter_signups to anon, authenticated;
grant all on public.newsletter_signups to service_role;
alter table public.newsletter_signups enable row level security;
drop policy if exists "anyone can subscribe" on public.newsletter_signups;
create policy "anyone can subscribe" on public.newsletter_signups
  for insert to anon, authenticated with check (true);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- SEED NICKY BOY ----------
insert into public.products (
  id, slug, name, description, price, compare_at_price, currency,
  sizes, colors, images, stock_by_size, is_active
) values (
  'a1b2c3d4-0001-4000-8000-000000000001',
  'nicky-boy-signature-crewneck',
  'NICKY BOY / Signature Crewneck',
  'A heavyweight garment-dyed crewneck in matte black with contrast bone-white ribbing. Hand-drawn anime silhouette and cryptic rune column screen-printed on the chest. Cut boxy, worn oversized.',
  2499, 3299, 'INR',
  array['S','M','L','XL','XXL'],
  '[{"name":"Ink Black","value":"#0a0a0a"}]'::jsonb,
  array[]::text[],
  '{"S":12,"M":4,"L":0,"XL":8,"XXL":15}'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  compare_at_price = excluded.compare_at_price,
  sizes = excluded.sizes,
  stock_by_size = excluded.stock_by_size,
  is_active = excluded.is_active,
  updated_at = now();
