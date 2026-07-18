# NICKY BOY Admin Panel — Build Plan

A separate `/admin` area, dark utilitarian theme, hidden from public site, backed by Supabase Auth + an `admin_users` allowlist that RLS actually checks (not just "any logged-in user").

---

## 1. Backend / Database

New migration (`supabase-setup/admin.sql` + applied via migration tool):

- `admin_users(user_id uuid PK REFERENCES auth.users, email text, created_at)`.
- `public.is_admin()` SECURITY DEFINER function: `select exists(select 1 from admin_users where user_id = auth.uid())`. Prevents recursive RLS issues.
- New columns on `orders`: `tracking_number text`, `admin_notes text`.
- RLS policies (added, not replacing existing):
  - `orders`: `SELECT/UPDATE TO authenticated USING (public.is_admin())`. UPDATE policy uses a `WITH CHECK` that keeps `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `payment_status`, `total`, `subtotal` unchanged (enforced via a trigger `orders_admin_guard` because column-level CHECK on old vs new needs a trigger).
  - `products`: full `SELECT/INSERT/UPDATE/DELETE TO authenticated USING (public.is_admin())`.
  - `reviews`: `SELECT/UPDATE/DELETE TO authenticated USING (public.is_admin())` (approve/reject).
  - `newsletter_signups`: `SELECT TO authenticated USING (public.is_admin())`.
- `GRANT` statements for `authenticated` on each table matching the policies.
- Supabase Storage bucket `product-images` (public read), with admin-only write policy.

## 2. Auth wiring

- Enable persisted sessions for admin: create a second Supabase client `src/integrations/supabase/admin-client.ts` with `persistSession: true, autoRefreshToken: true` (the existing storefront client keeps `persistSession: false` — unchanged, so anonymous checkout is untouched).
- `src/lib/admin-auth.tsx`: React context providing `{ session, user, isAdmin, loading, signIn, signOut }`. On mount: `getSession()` + `onAuthStateChange`; `isAdmin` derived by querying `admin_users` for `user_id = auth.uid()`.

## 3. Routes

```
src/routes/admin.tsx              → layout: AdminAuthProvider + gate + sidebar shell
src/routes/admin.index.tsx        → Dashboard
src/routes/admin.login.tsx        → email/password login (public within /admin)
src/routes/admin.orders.tsx       → orders table + filters + CSV export
src/routes/admin.orders.$id.tsx   → order detail + status/tracking update
src/routes/admin.products.tsx     → product list
src/routes/admin.products.$id.tsx → product edit (incl. image upload, stock_by_size)
src/routes/admin.reviews.tsx      → reviews moderation
src/routes/admin.newsletter.tsx   → newsletter signups + CSV export
```

Gate logic in `admin.tsx`: if `loading` → spinner; if no session or `!isAdmin` → render `<AdminLogin />` (or redirect to `/admin/login`); else render sidebar + `<Outlet />`. No admin data is ever fetched before the gate passes.

Login page: email + password form → `supabase.auth.signInWithPassword` → checks `admin_users` → if not admin, immediately `signOut()` and shows "Not authorized".

## 4. UI

Dark theme reusing existing tokens, but utilitarian: monospace-ish density, shadcn `Table`, `Card`, `Badge`, `Select`, `Input`, `Button`, `Dialog`. Sidebar via existing shadcn `Sidebar` pattern.

- **Dashboard**: 5 metric cards (total orders, revenue paid, pending orders, today's orders, AOV) + low-stock alert list + pending reviews count + newsletter count + last-10 orders table.
- **Orders**: TanStack Query fetch, client-side search (name/email/id) + status filter, sortable columns, pagination (25/page), CSV export builds a Blob and downloads.
- **Order detail**: full JSONB items rendered, address block, payment ids (read-only), editable `order_status`, `tracking_number`, `admin_notes`. Save via `supabase.from('orders').update(...)` — RLS + trigger enforce that only allowed columns actually change.
- **Products**: list + edit form. Image upload via Storage `product-images`. `stock_by_size` edited as per-size number inputs.
- **Reviews**: filterable pending/approved, one-click approve (`is_approved = true`) or delete.
- **Newsletter**: table + CSV export.

Toasts via `sonner` on every write; loading skeletons; empty states everywhere.

## 5. Security guarantees

- Public site is untouched — same anon key, no session persistence, no exposure of admin.
- `is_admin()` is the single source of truth, referenced by every admin RLS policy.
- Trigger `orders_admin_guard` (BEFORE UPDATE) hard-blocks any change to payment fields regardless of client code — payment integrity preserved even if an admin's UI is tampered with.
- Service role key never touched from the browser.
- `/admin` renders login before any query fires, so an unauthenticated visitor sees zero order/customer data.

## 6. First-admin instructions (delivered after build)

1. Supabase Dashboard → **Authentication → Users → Add user** → email + password (turn OFF "Send invite email" or use "Create user"). Copy the resulting user's UUID.
2. Supabase Dashboard → **SQL Editor**, run:
   ```sql
   insert into public.admin_users (user_id, email)
   values ('<paste-uuid>', '<the email>');
   ```
3. Visit `/admin`, sign in with those credentials.

That's it — no code redeploy needed for future admins; just repeat steps 1–2.

---

## Technical notes

- Uses the existing `supabase-js` client + a second instance for admin session persistence to avoid disturbing checkout.
- All admin data reads go through the storefront's `sb_publishable_` key but authenticated as the admin user — RLS grants access via `is_admin()`.
- No edge functions added; all admin writes are direct table writes protected by RLS + trigger.
- CSV export is pure client (no server round trip).