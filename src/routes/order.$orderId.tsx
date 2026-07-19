import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Truck, Package, CreditCard, Wallet } from "lucide-react";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$orderId")({ component: OrderConfirmation });

type OrderRecord = {
  id: string;
  customer_name: string;
  email: string;
  total: number;
  subtotal?: number;
  shipping?: number;
  cod_fee?: number;
  currency: string;
  items: Array<{ name: string; size: string; quantity: number; price: number; image?: string | null }>;
  shipping_address: { address: string; city: string; state: string; pincode: string };
  status: string;
  payment_method?: "razorpay" | "cod";
  payment_status?: "paid" | "pending" | "failed";
  order_status?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  created_at: string;
};
type StoredReceipt = { order: OrderRecord };

function OrderConfirmation() {
  const { orderId } = useParams({ from: "/order/$orderId" });
  const [receipt, setReceipt] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`nb_order_${orderId}`);
    if (raw) {
      try { setReceipt(JSON.parse(raw) as StoredReceipt); } catch { /* noop */ }
    }
  }, [orderId]);

  const order = receipt?.order;
  const isCod = order?.payment_method === "cod";
  const eta = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (isCod ? 6 : 4));
    const d2 = new Date();
    d2.setDate(d2.getDate() + (isCod ? 9 : 6));
    const fmt = (x: Date) => x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${fmt(d)} – ${fmt(d2)}`;
  })();

  const paymentLabel = isCod ? "Cash on Delivery" : "Razorpay";
  const paymentStatusLabel = order?.payment_status
    ? order.payment_status.toUpperCase()
    : (isCod ? "PENDING" : "PAID");
  const currency = order?.currency ?? PRODUCT.currency;

  return (
    <main className="min-h-screen bg-background text-foreground grain">
      <div className="mx-auto max-w-[900px] px-5 md:px-10 py-14 md:py-20">
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <span className="w-14 h-14 rounded-full border border-ember/50 grid place-items-center bg-ember/10">
            <CheckCircle2 className="w-8 h-8 text-ember" strokeWidth={1.4} />
          </span>
          <p className="kicker">
            <span className="text-ember">◆</span>{" "}
            {isCod ? "Order confirmed" : "Payment confirmed"}
          </p>
          <h1 className="display-h text-3xl md:text-5xl leading-[0.95]">
            {isCod ? (
              <>Your Cash on Delivery<br/><span className="text-ember">order is placed.</span></>
            ) : (
              <>Order placed.<br/><span className="text-ember">Welcome to the drop.</span></>
            )}
          </h1>
          <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
            Order ID · {orderId}
          </p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetaCard
            icon={isCod ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
            label="Payment"
            value={paymentLabel}
          />
          <MetaCard
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Status"
            value={paymentStatusLabel}
            accent={paymentStatusLabel === "PAID"}
          />
          <MetaCard
            icon={<Truck className="w-4 h-4" />}
            label="Est. delivery"
            value={eta}
          />
          <MetaCard
            icon={<Package className="w-4 h-4" />}
            label="Order"
            value={(order?.order_status ?? "CONFIRMED").toString().toUpperCase()}
          />
        </div>

        {order ? (
          <div className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <p className="kicker mb-1">Shipping to</p>
                <p>{order.customer_name}</p>
                <p className="text-muted-foreground">{order.email}</p>
                <p className="text-muted-foreground mt-1">
                  {order.shipping_address.address}, {order.shipping_address.city},{" "}
                  {order.shipping_address.state} {order.shipping_address.pincode}
                </p>
              </div>
              <div className="text-right">
                <p className="kicker mb-1">Payment reference</p>
                <p className="break-all text-muted-foreground">
                  {order.razorpay_payment_id ?? (isCod ? "COD (no reference)" : "—")}
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 pt-4 divide-y divide-border/60">
              {order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt={it.name} className="w-14 h-16 object-cover rounded-md" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm truncate">{it.name}</p>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      Size {it.size} · Qty {it.quantity}
                    </p>
                  </div>
                  <p className="font-mono text-xs">
                    {currency}{(it.price * it.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 font-mono text-xs pt-1">
              {typeof order.subtotal === "number" && (
                <RowKV label="Subtotal" value={`${currency}${order.subtotal.toLocaleString("en-IN")}`} />
              )}
              {typeof order.shipping === "number" && (
                <RowKV label="Shipping" value={order.shipping === 0 ? "Free" : `${currency}${order.shipping}`} />
              )}
              {isCod && typeof order.cod_fee === "number" && order.cod_fee > 0 && (
                <RowKV label="COD fee" value={`${currency}${order.cod_fee}`} />
              )}
            </div>

            <div className="flex items-baseline justify-between border-t border-border/60 pt-3">
              <span className="kicker">{isCod ? "Total payable on delivery" : "Total paid"}</span>
              <span className="font-display text-3xl">
                {currency}{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/70 p-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              Your order is placed. A confirmation email is on its way with the full receipt.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <Link
            to="/"
            className="inline-block font-mono text-[11px] tracking-[0.28em] uppercase border border-foreground/40 hover:border-foreground rounded-md px-6 py-3 transition-colors"
          >
            Continue shopping
          </Link>
          <Link
            to="/track-order"
            search={{ order: orderId, email: order?.email }}
            className="inline-block font-mono text-[11px] tracking-[0.28em] uppercase bg-ember text-ink rounded-md px-6 py-3 hover:brightness-110 transition"
          >
            Track order
          </Link>
        </div>
      </div>
    </main>
  );
}

function MetaCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/30 backdrop-blur p-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={cn(accent ? "text-ember" : "text-foreground/70")}>{icon}</span>
        <span className="kicker">{label}</span>
      </div>
      <p className={cn("mt-1 font-mono text-xs", accent && "text-ember")}>{value}</p>
    </div>
  );
}

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
