// supabase/functions/verify-razorpay-payment/index.ts
// Secrets required: RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { sendOrderEmails } from "../_shared/order-emails.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET")?.trim();
    if (!secret) return json({ error: "razorpay_not_configured" }, 500);

    const b = (await req.json()) as Body;
    if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature)
      return json({ error: "missing_fields" }, 400);

    const expected = await hmacSha256Hex(
      `${b.razorpay_order_id}|${b.razorpay_payment_id}`,
      secret,
    );
    const valid = timingSafeEqual(expected, b.razorpay_signature);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    if (!valid) {
      await admin.from("orders")
        .update({ status: "failed", payment_status: "failed", order_status: "cancelled" })
        .eq("razorpay_order_id", b.razorpay_order_id);
      return json({ error: "invalid_signature" }, 400);
    }

    const { data, error } = await admin.from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        order_status: "confirmed",
        razorpay_payment_id: b.razorpay_payment_id,
        razorpay_signature: b.razorpay_signature,
      })
      .eq("razorpay_order_id", b.razorpay_order_id)
      .select("id,customer_name,email,total,currency,items,shipping_address,status,payment_method,payment_status,order_status,razorpay_payment_id,razorpay_order_id,cod_fee,shipping,subtotal,created_at")
      .single();
    if (error || !data) return json({ error: "order_not_found" }, 404);

    // Atomic per-size stock decrement. Best-effort: payment is already captured.
    // If this fails we log via the response but still confirm the order so the
    // customer sees success; ops can reconcile from the orders table.
    try {
      const items = (data.items as Array<{ product_id: string; size: string; quantity: number }>) ?? [];
      const { data: rpcErr } = await admin.rpc("decrement_stock", { _items: items });
      if (rpcErr) {
        console.error("decrement_stock returned:", rpcErr);
      }
    } catch (e) {
      console.error("decrement_stock threw:", e);
    }

    return json({ ok: true, order: data });
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});

async function hmacSha256Hex(msg: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}
function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...cors, "Content-Type": "application/json" },
  });
}
