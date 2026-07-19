import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Package, Truck, Home, XCircle, Loader2, Search, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/nickyboy/footer";

type Search = { order?: string; email?: string };

export const Route = createFileRoute("/track-order")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    order: typeof s.order === "string" ? s.order : undefined,
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — NICKY BOY" },
      { name: "description", content: "Look up your NICKY BOY order status with your order ID and email." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackOrderPage,
});

type OrderRow = {
  id: string;
  customer_name: string;
  email: string;
  shipping_address: { address?: string; city?: string; state?: string; pincode?: string; country?: string } | null;
  items: Array<{ name?: string; size?: string; quantity?: number; price?: number; image?: string | null }>;
  subtotal: number;
  shipping: number;
  cod_fee?: number | null;
  total: number;
  currency: string;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  tracking_number?: string | null;
  tracking_courier?: string | null;
  tracking_url?: string | null;
  created_at: string;
};

const STEPS = ["placed", "processing", "shipped", "delivered"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  placed: "Order Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

function stepIndex(order: OrderRow): number {
  const s = (order.order_status || "").toLowerCase();
  if (s === "delivered") return 3;
  if (s === "shipped") return 2;
  if (s === "processing" || s === "confirmed") return 1;
  return 0;
}

function isTerminalBad(order: OrderRow): "cancelled" | "failed" | null {
  const s = (order.order_status || order.status || "").toLowerCase();
  if (s === "cancelled" || s === "returned") return "cancelled";
  if (s === "failed" || order.payment_status === "failed") return "failed";
  return null;
}

function TrackOrderPage() {
  const { order: qOrder, email: qEmail } = Route.useSearch();
  const navigate = useNavigate({ from: "/track-order" });
  const [orderId, setOrderId] = useState(qOrder ?? "");
  const [email, setEmail] = useState(qEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(id: string, mail: string) {
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const { data, error: err } = await supabase.rpc("lookup_order", {
        _id: id.trim(),
        _email: mail.trim(),
      });
      if (err) throw err;
      if (!data) {
        setError("We couldn't find an order with those details. Please check and try again.");
      } else {
        setOrder(data as OrderRow);
      }
    } catch {
      setError("We couldn't find an order with those details. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup when arriving with query params.
  useEffect(() => {
    if (qOrder && qEmail && !order && !loading) {
      lookup(qOrder, qEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qOrder, qEmail]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) return;
    navigate({ search: { order: orderId.trim(), email: email.trim() }, replace: true });
    lookup(orderId, email);
  }

  return (
    <>
      <main className="min-h-screen bg-background text-foreground grain">
        <div className="mx-auto max-w-[900px] px-5 md:px-10 py-12 md:py-16">
          <div className="mb-8">
            <p className="kicker mb-3"><span className="text-ember">◆</span> Order tracking</p>
            <h1 className="display-h text-3xl md:text-5xl leading-[0.95]">Track your order</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg">
              Enter your order ID and the email address you used at checkout.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-5 md:p-6 grid md:grid-cols-[1fr_1fr_auto] gap-3 mb-8"
          >
            <div>
              <label className="kicker block mb-1.5">Order ID</label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. 8f4a3b2c-…"
                className="w-full h-11 px-3 rounded-md bg-background/50 border border-border/70 focus:border-ember focus:ring-2 focus:ring-ember/25 outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="kicker block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full h-11 px-3 rounded-md bg-background/50 border border-border/70 focus:border-ember focus:ring-2 focus:ring-ember/25 outline-none text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !orderId.trim() || !email.trim()}
                className="h-11 px-6 rounded-md bg-ember text-ink font-mono text-[11px] tracking-[0.28em] uppercase hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track
              </button>
            </div>
          </form>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-6">
              {error}
            </div>
          )}

          {order && <OrderView order={order} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function OrderView({ order }: { order: OrderRow }) {
  const bad = isTerminalBad(order);
  const idx = stepIndex(order);
  const currency = order.currency || "INR";
  const cur = (n: number) => `${currency === "INR" ? "₹" : currency + " "}${n.toLocaleString("en-IN")}`;
  const isCod = order.payment_method === "cod";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="kicker mb-1">Order</p>
            <p className="font-mono text-xs break-all">{order.id}</p>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
              {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="kicker mb-1">Total {isCod && order.payment_status !== "paid" ? "(COD)" : "paid"}</p>
            <p className="font-display text-3xl">{cur(order.total)}</p>
          </div>
        </div>

        {bad ? (
          <div className={cn(
            "rounded-lg border p-4 flex items-start gap-3",
            bad === "cancelled" ? "border-muted-foreground/40 bg-muted/20" : "border-destructive/50 bg-destructive/10"
          )}>
            <XCircle className={cn("w-5 h-5 mt-0.5", bad === "failed" && "text-destructive")} />
            <div>
              <p className="font-display text-lg">
                {bad === "cancelled" ? "Order cancelled" : "Payment failed"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {bad === "cancelled"
                  ? "This order was cancelled. Contact us if you have questions."
                  : "The payment for this order did not go through. Please place the order again."}
              </p>
            </div>
          </div>
        ) : (
          <StepTracker current={idx} />
        )}

        {order.tracking_number && !bad && (
          <div className="mt-6 rounded-lg border border-ember/40 bg-ember/5 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="kicker mb-1">Shipment</p>
              <p className="font-mono text-sm">
                {order.tracking_courier || "Courier"} · {order.tracking_number}
              </p>
            </div>
            {order.tracking_url && (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-ember text-ink font-mono text-[11px] tracking-[0.24em] uppercase hover:brightness-110"
              >
                Track with {order.tracking_courier || "courier"}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-6 md:p-8 grid md:grid-cols-2 gap-6">
        <div>
          <p className="kicker mb-2">Shipping to</p>
          <p className="text-sm">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">{order.email}</p>
          {order.shipping_address && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {order.shipping_address.address}<br />
              {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.pincode].filter(Boolean).join(", ")}
              {order.shipping_address.country ? <><br />{order.shipping_address.country}</> : null}
            </p>
          )}
        </div>
        <div>
          <p className="kicker mb-2">Payment</p>
          <p className="text-sm">{isCod ? "Cash on Delivery" : "Razorpay"}</p>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            {(order.payment_status || "pending").toUpperCase()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-6 md:p-8">
        <p className="kicker mb-4">Items</p>
        <div className="divide-y divide-border/60">
          {(order.items || []).map((it, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              {it.image && <img src={it.image} alt={it.name} className="w-14 h-16 object-cover rounded-md" />}
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm truncate">{it.name}</p>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                  Size {it.size} · Qty {it.quantity}
                </p>
              </div>
              <p className="font-mono text-xs">{cur((it.price ?? 0) * (it.quantity ?? 1))}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-border/60 pt-4 mt-2 space-y-1.5 font-mono text-xs">
          <Row label="Subtotal" value={cur(order.subtotal)} />
          <Row label="Shipping" value={order.shipping ? cur(order.shipping) : "Free"} />
          {order.cod_fee ? <Row label="COD fee" value={cur(order.cod_fee)} /> : null}
          <div className="flex justify-between pt-2 mt-2 border-t border-border/60 font-display text-base">
            <span>Total</span><span>{cur(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-block font-mono text-[11px] tracking-[0.28em] uppercase border border-foreground/40 hover:border-foreground rounded-md px-6 py-3 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function StepTracker({ current }: { current: number }) {
  const icons = [Home, Package, Truck, CheckCircle2];
  return (
    <div className="relative">
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {STEPS.map((s, i) => {
          const Icon = icons[i];
          const done = i <= current;
          const active = i === current;
          return (
            <div key={s} className="flex flex-col items-center text-center">
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full grid place-items-center border-2 transition-colors",
                done ? "border-ember bg-ember/10 text-ember" : "border-border/60 text-muted-foreground",
                active && "ring-4 ring-ember/20"
              )}>
                <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.6} />
              </div>
              <p className={cn(
                "mt-2 font-mono text-[10px] md:text-[11px] tracking-[0.16em] uppercase",
                done ? "text-foreground" : "text-muted-foreground"
              )}>{STEP_LABELS[s]}</p>
            </div>
          );
        })}
      </div>
      <div className="absolute top-5 md:top-6 left-[12.5%] right-[12.5%] h-[2px] bg-border/60 -z-10">
        <div
          className="h-full bg-ember transition-all duration-500"
          style={{ width: `${(current / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
