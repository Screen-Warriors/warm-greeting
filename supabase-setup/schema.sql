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
-- Legacy enum kept for back-compat with existing `status` column.
do $$ begin
  create type public.order_status as enum ('pending','paid','failed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.orders (
  id                    uuid primary key default gen_random_uuid(),
  customer_name         text not null,
  email                 text not null,
  phone                 text not null,                 -- legacy / full E.164 mirror
  country_code          text,                          -- e.g. '+91'
  phone_number          text,                          -- national digits only, e.g. '9876543210'
  full_phone_number     text,                          -- E.164, e.g. '+919876543210'
  shipping_address      jsonb not null,
  items                 jsonb not null,
  sizes                 text,
  subtotal              integer not null,
  shipping              integer not null default 0,
  discount              integer not null default 0,
  cod_fee               integer not null default 0,
  total                 integer not null,
  currency              text not null default 'INR',
  status                public.order_status not null default 'pending',
  payment_method        text not null default 'razorpay',   -- 'razorpay' | 'cod'
  payment_status        text not null default 'pending',    -- 'paid' | 'pending' | 'failed'
  order_status          text not null default 'pending',    -- 'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'|'returned'
  razorpay_order_id     text unique,
  razorpay_payment_id   text,
  razorpay_signature    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Idempotent column adds for existing databases.
alter table public.orders add column if not exists discount integer not null default 0;
alter table public.orders add column if not exists cod_fee integer not null default 0;
alter table public.orders add column if not exists payment_method text not null default 'razorpay';
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists order_status text not null default 'pending';
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_courier text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists country_code text;
alter table public.orders add column if not exists phone_number text;
alter table public.orders add column if not exists full_phone_number text;
alter table public.orders add column if not exists sizes text;

create index if not exists orders_razorpay_order_id_idx on public.orders(razorpay_order_id);
create index if not exists orders_email_idx on public.orders(email);
create index if not exists orders_payment_method_idx on public.orders(payment_method);
create index if not exists orders_order_status_idx on public.orders(order_status);

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

-- ---------- Atomic stock reserve/decrement ----------
-- Called by Edge Functions (service_role) after a successful payment (or COD
-- confirmation). Locks each product row, re-validates stock, and decrements
-- the per-size counter in one transaction. Returns null on success, or a
-- jsonb payload describing the first size that came up short so the caller
-- can surface a clear error instead of overselling.
create or replace function public.decrement_stock(_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  it jsonb;
  pid uuid;
  sz text;
  qty int;
  cur int;
  next_stock jsonb;
begin
  for it in select * from jsonb_array_elements(_items) loop
    pid := (it->>'product_id')::uuid;
    sz  := it->>'size';
    qty := coalesce((it->>'quantity')::int, 0);
    if qty <= 0 then continue; end if;

    -- Lock the product row for the duration of the transaction.
    select coalesce((stock_by_size->>sz)::int, 0), stock_by_size
      into cur, next_stock
      from public.products
      where id = pid
      for update;

    if cur is null or cur < qty then
      return jsonb_build_object(
        'error', 'insufficient_stock',
        'product_id', pid,
        'size', sz,
        'available', coalesce(cur, 0)
      );
    end if;

    update public.products
      set stock_by_size = jsonb_set(next_stock, array[sz], to_jsonb(cur - qty)),
          updated_at = now()
      where id = pid;
  end loop;
  return null;
end $$;

revoke all on function public.decrement_stock(jsonb) from public, anon, authenticated;
grant execute on function public.decrement_stock(jsonb) to service_role;

-- ---------- CONTACT SUBMISSIONS ----------
create table if not exists public.contact_submissions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text not null,
  message     text not null,
  status      text not null default 'unread',  -- 'unread' | 'read' | 'replied' | 'archived'
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint contact_submissions_name_len check (char_length(name) between 2 and 100),
  constraint contact_submissions_email_len check (char_length(email) between 3 and 255),
  constraint contact_submissions_subject_len check (char_length(subject) between 1 and 120),
  constraint contact_submissions_message_len check (char_length(message) between 10 and 2000),
  constraint contact_submissions_status_chk check (status in ('unread','read','replied','archived'))
);

create index if not exists contact_submissions_status_idx on public.contact_submissions(status);
create index if not exists contact_submissions_created_idx on public.contact_submissions(created_at desc);

grant insert on public.contact_submissions to anon, authenticated;
grant all on public.contact_submissions to service_role;

alter table public.contact_submissions enable row level security;

drop policy if exists "anyone can submit a contact form" on public.contact_submissions;
create policy "anyone can submit a contact form" on public.contact_submissions
  for insert to anon, authenticated with check (
    char_length(name) between 2 and 100
    and char_length(email) between 3 and 255
    and char_length(subject) between 1 and 120
    and char_length(message) between 10 and 2000
  );

drop trigger if exists trg_contact_submissions_updated_at on public.contact_submissions;
create trigger trg_contact_submissions_updated_at before update on public.contact_submissions
  for each row execute function public.set_updated_at();

-- ---------- EMAIL LOGS ----------
-- Records every transactional email send (owner notification + customer confirmation).
-- Used both for ops visibility and as an idempotency guard so retries don't double-send.
create table if not exists public.email_logs (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid references public.orders(id) on delete cascade,
  email_type     text not null,       -- 'owner_notify' | 'customer_confirmation'
  recipient      text not null,
  status         text not null,       -- 'sent' | 'failed'
  provider_id    text,                -- Resend message id
  error_message  text,
  sent_at        timestamptz not null default now()
);

create index if not exists email_logs_order_idx on public.email_logs(order_id, email_type, status);
create index if not exists email_logs_sent_idx  on public.email_logs(sent_at desc);

grant all on public.email_logs to service_role;
alter table public.email_logs enable row level security;
-- Client cannot read or write. Only Edge Functions (service_role) touch this table.

-- ---------- ORDER LOOKUP (guest tracking) ----------
-- Anyone can call this, but must supply BOTH the order id AND the exact email
-- to receive a row back. Sensitive columns (razorpay signature, etc.) are
-- excluded from the returned payload.
create or replace function public.lookup_order(_id uuid, _email text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', o.id,
    'customer_name', o.customer_name,
    'email', o.email,
    'shipping_address', o.shipping_address,
    'items', o.items,
    'subtotal', o.subtotal,
    'shipping', o.shipping,
    'cod_fee', o.cod_fee,
    'total', o.total,
    'currency', o.currency,
    'status', o.status,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'order_status', o.order_status,
    'tracking_number', o.tracking_number,
    'tracking_courier', o.tracking_courier,
    'tracking_url', o.tracking_url,
    'created_at', o.created_at,
    'updated_at', o.updated_at
  )
  from public.orders o
  where o.id = _id
    and lower(trim(o.email)) = lower(trim(_email))
  limit 1
$$;

-- Optional tracking columns (idempotent add for existing DBs).
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_courier text;
alter table public.orders add column if not exists tracking_url text;

revoke all on function public.lookup_order(uuid, text) from public;
grant execute on function public.lookup_order(uuid, text) to anon, authenticated;
