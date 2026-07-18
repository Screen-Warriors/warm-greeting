// supabase/functions/create-razorpay-order/index.ts
// Deploy: Dashboard → Edge Functions → Create function → paste this file.
// Secrets required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
//                   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Item = { product_id: string; size: string; quantity: number };
type Body = {
  items: Item[];
  customer: { name: string; email: string; phone: string };
  shipping: {
    address: string; city: string; state: string; pincode: string; country?: string;
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const RZP_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")?.trim();
    const RZP_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();
    if (!RZP_KEY_ID || !RZP_KEY_SECRET) return json({ error: "razorpay_not_configured" }, 500);
    if (!RZP_KEY_ID.startsWith("rzp_")) return json({ error: "razorpay_key_id_invalid" }, 500);

    const body = (await req.json()) as Body;
    if (!body?.items?.length) return json({ error: "empty_cart" }, 400);
    if (!body.customer?.name || !body.customer?.email || !body.customer?.phone)
      return json({ error: "missing_customer" }, 400);
    if (!body.shipping?.address || !body.shipping?.city || !body.shipping?.state || !body.shipping?.pincode)
      return json({ error: "missing_shipping" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Server-side price recompute — never trust client totals.
    const ids = [...new Set(body.items.map((i) => i.product_id))];
    const { data: products, error: pErr } = await admin
      .from("products")
      .select("id,name,price,currency,is_active,stock_by_size,images")
      .in("id", ids);
    if (pErr) return json({ error: "product_lookup_failed", detail: pErr.message }, 500);

    const byId = new Map(products?.map((p) => [p.id as string, p]) ?? []);
    let subtotal = 0;
    const enrichedItems: Array<Record<string, unknown>> = [];
    for (const it of body.items) {
      const p = byId.get(it.product_id);
      if (!p || !p.is_active) return json({ error: "product_unavailable", product_id: it.product_id }, 400);
      const stock = (p.stock_by_size as Record<string, number>)?.[it.size] ?? 0;
      if (!Number.isInteger(it.quantity) || it.quantity < 1) return json({ error: "bad_quantity" }, 400);
      if (stock < it.quantity) return json({ error: "insufficient_stock", size: it.size }, 400);
      const line = (p.price as number) * it.quantity;
      subtotal += line;
      enrichedItems.push({
        product_id: p.id, name: p.name, size: it.size,
        price: p.price, quantity: it.quantity,
        image: (p.images as string[])?.[0] ?? null,
      });
    }
    const shipping = subtotal >= 2500 ? 0 : 99;
    const total = subtotal + shipping;
    const currency = (products?.[0]?.currency as string) ?? "INR";

    // Human-readable size summary for the dashboard column (e.g. "M × 1, XL × 2").
    const sizesSummary = enrichedItems
      .map((it) => `${it.size} × ${it.quantity}`)
      .join(", ");

    // Insert pending order first so we always have a DB row that mirrors Razorpay.
    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        customer_name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        shipping_address: body.shipping,
        items: enrichedItems,
        sizes: sizesSummary,
        subtotal, shipping, total, currency,
        status: "pending",
      })
      .select("id")
      .single();
    if (oErr || !order) return json({ error: "order_insert_failed", detail: oErr?.message }, 500);

    // Create Razorpay order (amount in paise for INR).
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`),
      },
      body: JSON.stringify({
        amount: total * 100,
        currency,
        receipt: order.id,
        notes: { order_id: order.id, email: body.customer.email },
      }),
    });
    const rzpJson = await rzpRes.json();
    if (!rzpRes.ok) {
      await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
      const rzpError = rzpJson?.error ?? {};
      const authFailed =
        rzpRes.status === 401 ||
        String(rzpError?.description ?? "").toLowerCase().includes("authentication failed");

      return json({
        error: authFailed ? "razorpay_auth_failed" : "razorpay_order_failed",
        detail: {
          code: rzpError?.code ?? `HTTP_${rzpRes.status}`,
          description: rzpError?.description ?? "Razorpay order creation failed",
          key_mode: RZP_KEY_ID.startsWith("rzp_test_") ? "test" : RZP_KEY_ID.startsWith("rzp_live_") ? "live" : "unknown",
          fix: authFailed
            ? "Update Supabase Edge Function secrets with a matching Razorpay key id and key secret from the same mode, then redeploy/retry."
            : undefined,
        },
      }, authFailed ? 401 : 502);
    }

    await admin.from("orders")
      .update({ razorpay_order_id: rzpJson.id })
      .eq("id", order.id);

    return json({
      order_id: order.id,
      razorpay_order_id: rzpJson.id,
      amount: rzpJson.amount,
      currency: rzpJson.currency,
      key_id: RZP_KEY_ID,
    });
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
