// supabase/functions/razorpay-webhook/index.ts
// Public endpoint — Razorpay POSTs to it. Verify signature before touching data.
// Secrets required: RAZORPAY_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// IMPORTANT: In the Supabase Dashboard, when deploying, mark this function as
//   "Verify JWT: OFF" so Razorpay can call it unauthenticated.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method_not_allowed", { status: 405 });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) return new Response("not_configured", { status: 500 });

  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const raw = await req.text();
  const expected = await hmacSha256Hex(raw, secret);
  if (!signature || !timingSafeEqual(expected, signature)) {
    return new Response("invalid_signature", { status: 401 });
  }

  const evt = JSON.parse(raw) as {
    event: string;
    payload: { payment: { entity: { order_id: string; id: string; status: string } } };
  };

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const p = evt.payload?.payment?.entity;
  if (!p?.order_id) return new Response("ok"); // ignore unrelated events

  if (evt.event === "payment.captured") {
    // Only escalate to paid if not already paid — client verify may have won the race.
    await admin.from("orders")
      .update({ status: "paid", razorpay_payment_id: p.id })
      .eq("razorpay_order_id", p.order_id)
      .neq("status", "paid");
  } else if (evt.event === "payment.failed") {
    await admin.from("orders")
      .update({ status: "failed", razorpay_payment_id: p.id })
      .eq("razorpay_order_id", p.order_id)
      .neq("status", "paid");
  }

  return new Response("ok");
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
