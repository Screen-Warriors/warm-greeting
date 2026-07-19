// supabase/functions/verify-razorpay-payment/index.ts
// Secrets required: RAZORPAY_KEY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
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

    // Fire-and-forget email notifications. Never block the confirmation on this.
    try { await sendOrderEmails(data as never); } catch (e) { console.error("sendOrderEmails threw:", e); }

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

// ===== Inlined from _shared/order-emails.ts =====
// Shared: send owner + customer emails via Resend after a paid order.
// Never throws — logs failures to the `email_logs` table so ops can retry.
// Import in each Edge Function that confirms a paid order.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const OWNER_EMAIL = Deno.env.get("OWNER_NOTIFY_EMAIL")?.trim() || "moneywithgenz@gmail.com";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "NICKY BOY <orders@moneywithgenz.com>";
const SUPPORT_EMAIL = "hello@moneywithgenz.co";

type OrderItem = {
  product_id?: string;
  name?: string;
  size?: string;
  quantity?: number;
  price?: number;
};

type OrderRow = {
  id: string;
  customer_name: string;
  email: string;
  phone?: string | null;
  full_phone_number?: string | null;
  shipping_address: Record<string, unknown> | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  cod_fee?: number | null;
  total: number;
  currency: string;
  payment_method: string;
  payment_status?: string | null;
  order_status?: string | null;
  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
  created_at: string;
};

function money(n: number, currency = "INR") {
  const v = (n / 1).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return currency === "INR" ? `₹${v}` : `${currency} ${v}`;
}

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

function addressLines(addr: Record<string, unknown> | null): string {
  if (!addr) return "";
  const { address, city, state, pincode, country } = addr as Record<string, string>;
  return [address, [city, state, pincode].filter(Boolean).join(", "), country].filter(Boolean).map(esc).join("<br>");
}

function itemsRows(items: OrderItem[], currency: string) {
  return items.map((it) => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #222;">${esc(it.name || "Item")}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #222;">${esc(it.size || "-")}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #222;text-align:center;">${esc(it.quantity ?? 1)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #222;text-align:right;">${money((it.price ?? 0) * (it.quantity ?? 1), currency)}</td>
    </tr>`).join("");
}

function ownerHtml(o: OrderRow): string {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#fff;color:#111;padding:24px;">
  <h2 style="margin:0 0 12px;">New Order — ${money(o.total, o.currency)} — ${esc(o.customer_name)}</h2>
  <p style="margin:0 0 16px;color:#555;">Order <strong>#${esc(o.id.slice(0, 8))}</strong> · ${new Date(o.created_at).toLocaleString("en-IN")} · ${esc(o.payment_method.toUpperCase())}</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
    <tr><td style="padding:4px 0;color:#666;">Customer</td><td>${esc(o.customer_name)}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Email</td><td>${esc(o.email)}</td></tr>
    <tr><td style="padding:4px 0;color:#666;">Phone</td><td>${esc(o.full_phone_number || o.phone || "-")}</td></tr>
    <tr><td style="padding:4px 0;color:#666;vertical-align:top;">Ship to</td><td>${addressLines(o.shipping_address)}</td></tr>
    ${o.razorpay_payment_id ? `<tr><td style="padding:4px 0;color:#666;">Payment ID</td><td>${esc(o.razorpay_payment_id)}</td></tr>` : ""}
    ${o.razorpay_order_id ? `<tr><td style="padding:4px 0;color:#666;">RZP Order</td><td>${esc(o.razorpay_order_id)}</td></tr>` : ""}
    <tr><td style="padding:4px 0;color:#666;">Order ID</td><td>${esc(o.id)}</td></tr>
  </table>

  <table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid #222;">
    <thead><tr>
      <th align="left" style="padding:8px;background:#f5f5f5;">Item</th>
      <th align="left" style="padding:8px;background:#f5f5f5;">Size</th>
      <th style="padding:8px;background:#f5f5f5;">Qty</th>
      <th align="right" style="padding:8px;background:#f5f5f5;">Line</th>
    </tr></thead>
    <tbody>${itemsRows(o.items || [], o.currency)}</tbody>
  </table>

  <table style="width:100%;font-size:14px;margin-top:12px;">
    <tr><td align="right" style="padding:2px 8px;color:#666;">Subtotal</td><td align="right" style="width:120px;padding:2px 0;">${money(o.subtotal, o.currency)}</td></tr>
    <tr><td align="right" style="padding:2px 8px;color:#666;">Shipping</td><td align="right" style="padding:2px 0;">${money(o.shipping, o.currency)}</td></tr>
    ${o.cod_fee ? `<tr><td align="right" style="padding:2px 8px;color:#666;">COD fee</td><td align="right" style="padding:2px 0;">${money(o.cod_fee, o.currency)}</td></tr>` : ""}
    <tr><td align="right" style="padding:8px;font-weight:bold;border-top:1px solid #222;">TOTAL</td><td align="right" style="padding:8px;font-weight:bold;border-top:1px solid #222;">${money(o.total, o.currency)}</td></tr>
  </table>
  </body></html>`;
}

function customerHtml(o: OrderRow): string {
  return `<!doctype html><html><body style="margin:0;background:#0a0a0a;color:#f5f3ef;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111;border:1px solid #222;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="font-family:'Arial Black',Arial,sans-serif;font-size:28px;letter-spacing:6px;color:#f5f3ef;">NICKY BOY</div>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;border-bottom:1px solid #222;">
          <div style="font-size:12px;letter-spacing:3px;color:#c0674a;text-transform:uppercase;">Order Confirmed</div>
        </td></tr>

        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0 0 12px;font-size:15px;line-height:1.6;">Hi ${esc(o.customer_name.split(" ")[0])},</p>
          <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:#c9c6bf;">
            Thanks for your order. We've received it and it's now being prepared for dispatch.
          </p>
          <p style="margin:0 0 4px;font-size:12px;letter-spacing:2px;color:#8a877f;text-transform:uppercase;">Order #${esc(o.id.slice(0, 8).toUpperCase())}</p>
          <p style="margin:0;font-size:12px;color:#8a877f;">${new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
        </td></tr>

        <tr><td style="padding:16px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#f5f3ef;border-top:1px solid #222;">
            <thead><tr>
              <th align="left" style="padding:10px 0;font-size:11px;letter-spacing:2px;color:#8a877f;font-weight:normal;">ITEM</th>
              <th align="center" style="padding:10px 0;font-size:11px;letter-spacing:2px;color:#8a877f;font-weight:normal;">SIZE</th>
              <th align="center" style="padding:10px 0;font-size:11px;letter-spacing:2px;color:#8a877f;font-weight:normal;">QTY</th>
              <th align="right" style="padding:10px 0;font-size:11px;letter-spacing:2px;color:#8a877f;font-weight:normal;">PRICE</th>
            </tr></thead>
            <tbody>
              ${(o.items || []).map((it) => `<tr>
                <td style="padding:12px 0;border-bottom:1px solid #1c1c1c;">${esc(it.name || "Item")}</td>
                <td align="center" style="padding:12px 0;border-bottom:1px solid #1c1c1c;">${esc(it.size || "-")}</td>
                <td align="center" style="padding:12px 0;border-bottom:1px solid #1c1c1c;">${esc(it.quantity ?? 1)}</td>
                <td align="right" style="padding:12px 0;border-bottom:1px solid #1c1c1c;">${money((it.price ?? 0) * (it.quantity ?? 1), o.currency)}</td>
              </tr>`).join("")}
            </tbody>
          </table>
        </td></tr>

        <tr><td style="padding:8px 32px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#c9c6bf;">
            <tr><td align="right" style="padding:4px 8px;">Subtotal</td><td align="right" style="width:120px;padding:4px 0;">${money(o.subtotal, o.currency)}</td></tr>
            <tr><td align="right" style="padding:4px 8px;">Shipping</td><td align="right" style="padding:4px 0;">${money(o.shipping, o.currency)}</td></tr>
            ${o.cod_fee ? `<tr><td align="right" style="padding:4px 8px;">COD fee</td><td align="right" style="padding:4px 0;">${money(o.cod_fee, o.currency)}</td></tr>` : ""}
            <tr><td align="right" style="padding:12px 8px 4px;font-weight:bold;color:#f5f3ef;border-top:1px solid #222;">TOTAL</td>
                <td align="right" style="padding:12px 0 4px;font-weight:bold;color:#f5f3ef;border-top:1px solid #222;">${money(o.total, o.currency)}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:16px 32px 8px;border-top:1px solid #222;">
          <div style="font-size:11px;letter-spacing:2px;color:#8a877f;text-transform:uppercase;margin-bottom:8px;">Shipping to</div>
          <div style="font-size:14px;line-height:1.6;color:#f5f3ef;">
            ${esc(o.customer_name)}<br>${addressLines(o.shipping_address)}
          </div>
        </td></tr>

        <tr><td style="padding:16px 32px 8px;">
          <div style="font-size:11px;letter-spacing:2px;color:#8a877f;text-transform:uppercase;margin-bottom:8px;">Estimated delivery</div>
          <div style="font-size:14px;color:#c9c6bf;">5–8 business days for metros, 7–12 days elsewhere in India.</div>
        </td></tr>

        <tr><td style="padding:24px 32px 32px;border-top:1px solid #222;text-align:center;">
          <div style="font-size:12px;color:#8a877f;line-height:1.7;">
            Questions? Write to <a href="mailto:${SUPPORT_EMAIL}" style="color:#c0674a;text-decoration:none;">${SUPPORT_EMAIL}</a><br>
            © NICKY BOY · Bengaluru, India
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </body></html>`;
}

async function sendResend(to: string, subject: string, html: string, replyTo?: string): Promise<{ ok: boolean; error?: string; id?: string }> {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY not set" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, reply_to: replyTo }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: `${r.status}: ${JSON.stringify(body)}` };
    return { ok: true, id: (body as { id?: string }).id };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function logEmail(admin: SupabaseClient, row: {
  order_id: string; email_type: string; recipient: string;
  status: string; provider_id?: string | null; error_message?: string | null;
}) {
  try {
    await admin.from("email_logs").insert(row);
  } catch (e) {
    console.error("email_logs insert failed:", e);
  }
}

// Idempotent: only sends if no `owner_notify` log row exists for this order.
async function sendOrderEmails(order: OrderRow): Promise<void> {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Idempotency guard — check if we already sent the owner notification.
  const { data: existing } = await admin
    .from("email_logs")
    .select("id")
    .eq("order_id", order.id)
    .eq("email_type", "owner_notify")
    .eq("status", "sent")
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const ownerSubject = `New Order — ${money(order.total, order.currency)} — ${order.customer_name}`;
  const ownerRes = await sendResend(OWNER_EMAIL, ownerSubject, ownerHtml(order), order.email);
  await logEmail(admin, {
    order_id: order.id,
    email_type: "owner_notify",
    recipient: OWNER_EMAIL,
    status: ownerRes.ok ? "sent" : "failed",
    provider_id: ownerRes.id ?? null,
    error_message: ownerRes.error ?? null,
  });

  if (order.email) {
    const custSubject = `Your NICKY BOY order is confirmed — #${order.id.slice(0, 8).toUpperCase()}`;
    const custRes = await sendResend(order.email, custSubject, customerHtml(order), SUPPORT_EMAIL);
    await logEmail(admin, {
      order_id: order.id,
      email_type: "customer_confirmation",
      recipient: order.email,
      status: custRes.ok ? "sent" : "failed",
      provider_id: custRes.id ?? null,
      error_message: custRes.error ?? null,
    });
  }
}
