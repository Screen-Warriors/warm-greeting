import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { PRODUCT } from "@/lib/product";

export const Route = createFileRoute("/order/$orderId")({ component: OrderConfirmation });

type StoredReceipt = {
  order: {
    id: string;
    customer_name: string;
    email: string;
    total: number;
    currency: string;
    items: Array<{ name: string; size: string; quantity: number; price: number; image?: string | null }>;
    shipping_address: { address: string; city: string; state: string; pincode: string };
    status: string;
    created_at: string;
  };
};

function OrderConfirmation() {
  const { orderId } = useParams({ from: "/order/$orderId" });
  const [receipt, setReceipt] = useState<StoredReceipt | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`nb_order_${orderId}`);
    if (raw) {
      try { setReceipt(JSON.parse(raw) as StoredReceipt); } catch { /* noop */ }
    }
  }, [orderId]);

  return (
    <main className="min-h-screen bg-background text-foreground grain">
      <div className="mx-auto max-w-[820px] px-5 md:px-10 py-16 md:py-24">
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <CheckCircle2 className="w-12 h-12 text-ember" strokeWidth={1.4} />
          <p className="kicker"><span className="text-ember">◆</span> Payment confirmed</p>
          <h1 className="display-h text-4xl md:text-6xl leading-[0.9]">
            Order placed.<br/><span className="text-ember">Welcome to the drop.</span>
          </h1>
          <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
            Order ID · {orderId}
          </p>
        </div>

        {receipt?.order ? (
          <div className="border border-border bg-card/40 backdrop-blur p-6 md:p-8 space-y-5">
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <p className="kicker mb-1">Shipping to</p>
                <p>{receipt.order.customer_name}</p>
                <p className="text-muted-foreground">{receipt.order.email}</p>
                <p className="text-muted-foreground mt-1">
                  {receipt.order.shipping_address.address}, {receipt.order.shipping_address.city},{" "}
                  {receipt.order.shipping_address.state} {receipt.order.shipping_address.pincode}
                </p>
              </div>
              <div className="text-right">
                <p className="kicker mb-1">Status</p>
                <p className="text-ember uppercase">{receipt.order.status}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4 divide-y divide-border">
              {receipt.order.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  {it.image && <img src={it.image} alt={it.name} className="w-12 h-14 object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm truncate">{it.name}</p>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      {it.size} · Qty {it.quantity}
                    </p>
                  </div>
                  <p className="font-mono text-xs">
                    {PRODUCT.currency}{(it.price * it.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="kicker">Total paid</span>
              <span className="font-display text-3xl">
                {PRODUCT.currency}{receipt.order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        ) : (
          <div className="border border-border p-6 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              Your payment succeeded. A confirmation email is on its way with the full receipt.
            </p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link to="/" className="inline-block font-mono text-[11px] tracking-[0.28em] uppercase border border-foreground/40 hover:border-foreground px-6 py-3">
            Back to drop
          </Link>
        </div>
      </div>
    </main>
  );
}
