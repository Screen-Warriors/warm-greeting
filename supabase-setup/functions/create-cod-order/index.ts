// supabase/functions/create-cod-order/index.ts
// Creates a Cash-on-Delivery order. No Razorpay involved.
// Secrets required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-injected).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COD_FEE = 50; // INR — configurable

type Item = { product_id: string; size: string; quantity: number };
type Body = {
  items: Item[];
  customer: {
    name: string; email: string; phone: string;
    country_code?: string; phone_number?: string;
    full_phone_number?: string; phone_country?: string;
  };
  shipping: {
    address: string; city: string; state: string; pincode: string; country?: string;
  };
};

function validatePhoneServer(c: Body["customer"]): string | null {
  const full = (c.full_phone_number || c.phone || "").trim();
  if (!/^\+\d{8,15}$/.test(full)) return "invalid_phone_format";
  const cc = (c.country_code || "").trim();
  const nat = (c.phone_number || "").trim();
  if (cc && !/^\+\d{1,4}$/.test(cc)) return "invalid_country_code";
  if (nat && !/^\d{4,15}$/.test(nat)) return "invalid_phone_number";
  if (cc && nat && `${cc}${nat}` !== full) return "phone_mismatch";
  if ((c.phone_country || "").toUpperCase() === "IN" && nat && nat.length !== 10) return "invalid_indian_phone";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const body = (await req.json()) as Body;
    if (!body?.items?.length) return json({ error: "empty_cart" }, 400);
    if (!body.customer?.name || !body.customer?.email || !body.customer?.phone)
      return json({ error: "missing_customer" }, 400);
    const phoneErr = validatePhoneServer(body.customer);
    if (phoneErr) return json({ error: phoneErr }, 400);
    if (!body.shipping?.address || !body.shipping?.city || !body.shipping?.state || !body.shipping?.pincode)
      return json({ error: "missing_shipping" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

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
    const cod_fee = COD_FEE;
    const total = subtotal + shipping + cod_fee;
    const currency = (products?.[0]?.currency as string) ?? "INR";

    const sizesSummary = enrichedItems
      .map((it) => `${it.size} × ${it.quantity}`)
      .join(", ");

    const { data: order, error: oErr } = await admin
      .from("orders")
      .insert({
        customer_name: body.customer.name,
        email: body.customer.email,
        phone: body.customer.phone,
        shipping_address: body.shipping,
        items: enrichedItems,
        sizes: sizesSummary,
        subtotal, shipping, cod_fee, discount: 0, total, currency,
        status: "pending",
        payment_method: "cod",
        payment_status: "pending",
        order_status: "confirmed",
      })
      .select("id,customer_name,email,total,currency,items,shipping_address,status,payment_method,payment_status,order_status,cod_fee,shipping,subtotal,created_at")
      .single();
    if (oErr || !order) return json({ error: "order_insert_failed", detail: oErr?.message }, 500);

    return json({ ok: true, order });
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
