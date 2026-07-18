# NICKY BOY — Backend deployment (Supabase Dashboard, ~10 minutes)

Everything below runs in your own Supabase project `zzjbztjcjgvmgrgoleuu`.
No CLI required — copy/paste in the dashboard.

Frontend is already wired to your project via `.env`:
- VITE_SUPABASE_URL=https://zzjbztjcjgvmgrgoleuu.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_v03TmjQrLBOtECQIfzpV6Q_TUxBj9ei
- VITE_RAZORPAY_KEY_ID=rzp_test_TF0Api7Y4G9ZY0

The client calls three Edge Functions. Nothing else is mocked — as soon as you
finish steps 1–3, live Razorpay Checkout runs end-to-end.

---

## Step 1 — Create schema & seed product (2 min)

Dashboard → **SQL Editor** → **New query** → paste the entire contents of
`supabase-setup/schema.sql` → **Run**.

You should see the `products`, `orders`, `reviews`, `newsletter_signups`
tables in the Table Editor, and the NICKY BOY row already present with id
`a1b2c3d4-0001-4000-8000-000000000001`.

RLS is enforced:
- `products` — public read of active rows only.
- `orders` — **sealed from the client**. Only Edge Functions (service role)
  read or write. Client-side status tampering is impossible.
- `reviews` — anyone can insert (forced `is_approved = false`); public reads
  are limited to approved rows.
- `newsletter_signups` — anyone can insert.

## Step 2 — Add Edge Function secrets (1 min)

Dashboard → **Project Settings** → **Edge Functions** → **Add new secret**.
Add these three:

| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_TF0Api7Y4G9ZY0` |
| `RAZORPAY_KEY_SECRET` | `Dlxsm532hSZrpHLzNbLWfBrU` (rotate & swap when going live) |
| `RAZORPAY_WEBHOOK_SECRET` | pick any strong random string; you'll paste the same value into Razorpay in Step 4 |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected — do not add them.

## Step 3 — Deploy the three Edge Functions (5 min)

For each of the three, Dashboard → **Edge Functions** → **Create a new function** →
paste the function file contents exactly. Names must match:

| Function name | Source file | Verify JWT |
|---|---|---|
| `create-razorpay-order` | `supabase-setup/functions/create-razorpay-order/index.ts` | ON (default) |
| `verify-razorpay-payment` | `supabase-setup/functions/verify-razorpay-payment/index.ts` | ON (default) |
| `razorpay-webhook` | `supabase-setup/functions/razorpay-webhook/index.ts` | **OFF** (Razorpay must be able to POST without a Supabase JWT — signature verification protects it) |

Click **Deploy** on each.

## Step 4 — Register the webhook in Razorpay (2 min)

Razorpay Dashboard → **Settings** → **Webhooks** → **Add New Webhook**.

- **Webhook URL:**
  ```
  https://zzjbztjcjgvmgrgoleuu.supabase.co/functions/v1/razorpay-webhook
  ```
- **Secret:** paste the same value you saved as `RAZORPAY_WEBHOOK_SECRET` in Step 2.
- **Active events:** `payment.captured`, `payment.failed`.

Click **Create webhook**.

## Step 5 — Test end-to-end

Open your live preview → add to cart → checkout → real Razorpay Test-mode modal
opens. Use any [Razorpay test card](https://razorpay.com/docs/payments/payments/test-card-details/)
(e.g. `4111 1111 1111 1111`, any future expiry, any CVV, OTP `1234`).

Check that:
1. A new row appears in `orders` with `status = paid` and both
   `razorpay_order_id` and `razorpay_payment_id` populated.
2. The order confirmation page shows the real order id and totals.
3. Cancel a payment mid-flow — the row stays `pending` and the checkout shows
   "Payment cancelled, you can try again."

## Going live later

Toggle Razorpay to Live mode → generate live key id + secret → in Supabase
**Edge Function secrets**, update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
to the live values. No code change; no redeploy needed. Register a new live-mode
webhook in Razorpay pointing at the same URL, and update `RAZORPAY_WEBHOOK_SECRET`
if you use a different secret for live.
