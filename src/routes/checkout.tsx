import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({ component: Checkout });

function Field({
  label, id, type = "text", value, onChange, placeholder, autoComplete, className,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string; className?: string;
}) {
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="kicker block mb-1.5">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full h-10 bg-transparent border border-border focus:border-ember outline-none px-3 font-mono text-sm transition-colors"
      />
    </label>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, count, clear } = useCart();
  const [f, setF] = useState({
    email: "", name: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [paying, setPaying] = useState(false);

  const shipping = subtotal >= 2500 ? 0 : 99;
  const total = subtotal + shipping;

  const canPay =
    items.length > 0 && f.email && f.name && f.phone.length >= 10 &&
    f.address && f.city && f.state && f.pincode.length === 6;

  const pay = () => {
    if (!canPay) { toast.error("Fill all shipping fields."); return; }
    setPaying(true);
    // Razorpay wiring lands with Cloud in the next phase.
    setTimeout(() => {
      setPaying(false);
      clear();
      toast.success("Payment simulated — order placed.");
      navigate({ to: "/" });
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-background text-foreground grain">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10 py-6 md:py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/70 hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 border border-foreground/60 grid place-items-center font-display text-xs">NB</span>
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase">Checkout</span>
          </div>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.24em] uppercase text-muted-foreground">
            <Lock className="w-3 h-3" strokeWidth={1.5} /> Secure
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-12 gap-5 md:gap-8"
        >
          {/* Form */}
          <div className="col-span-12 lg:col-span-7 space-y-5">
            <div>
              <p className="kicker mb-1"><span className="text-ember">◆</span> Step 01</p>
              <h1 className="display-h text-2xl md:text-3xl leading-none">Shipping</h1>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field className="col-span-2" label="Email" id="email" type="email" autoComplete="email"
                value={f.email} onChange={(v) => setF({ ...f, email: v })} placeholder="you@domain.com" />
              <Field label="Full name" id="name" autoComplete="name"
                value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="Nicky Boy" />
              <Field label="Phone" id="phone" type="tel" autoComplete="tel"
                value={f.phone} onChange={(v) => setF({ ...f, phone: v })} placeholder="+91" />
              <Field className="col-span-2" label="Address" id="address" autoComplete="street-address"
                value={f.address} onChange={(v) => setF({ ...f, address: v })} placeholder="Street, apt, landmark" />
              <Field label="City" id="city" autoComplete="address-level2"
                value={f.city} onChange={(v) => setF({ ...f, city: v })} />
              <Field label="State" id="state" autoComplete="address-level1"
                value={f.state} onChange={(v) => setF({ ...f, state: v })} />
              <Field label="Pincode" id="pincode" autoComplete="postal-code"
                value={f.pincode} onChange={(v) => setF({ ...f, pincode: v.replace(/\D/g, "").slice(0, 6) })} />
            </div>

            <div className="pt-2">
              <p className="kicker mb-2"><span className="text-ember">◆</span> Step 02 · Payment</p>
              <div className="border border-border p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-ember" strokeWidth={1.5} />
                  <div>
                    <p className="font-mono text-xs">Razorpay</p>
                    <p className="text-[11px] text-muted-foreground">UPI · Cards · Netbanking · Wallets</p>
                  </div>
                </div>
                <span className="kicker text-ember">Selected</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <aside className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-6 border border-border bg-card/40 backdrop-blur p-5 space-y-4">
              <div className="flex items-baseline justify-between">
                <h2 className="display-h text-xl">Order</h2>
                <span className="kicker">{count} item{count === 1 ? "" : "s"}</span>
              </div>

              <div className="max-h-[220px] overflow-y-auto divide-y divide-border -mx-1">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1 py-3">
                    Your bag is empty. <Link to="/" className="text-ember underline">Go back</Link>.
                  </p>
                ) : items.map((it) => (
                  <div key={it.id} className="flex gap-3 py-2.5 px-1">
                    <div className="w-12 h-14 bg-muted shrink-0 overflow-hidden">
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm leading-tight truncate">{it.name}</p>
                      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">
                        {it.size} · Qty {it.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-xs shrink-0">
                      {PRODUCT.currency}{(it.price * it.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-3 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{PRODUCT.currency}{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{shipping === 0 ? "Free" : `${PRODUCT.currency}${shipping}`}</span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-border">
                  <span className="kicker">Total</span>
                  <span className="font-display text-2xl">{PRODUCT.currency}{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={pay}
                disabled={!canPay || paying}
                className={cn(
                  "w-full h-12 font-mono text-[11px] tracking-[0.28em] uppercase transition-all",
                  canPay && !paying ? "bg-ember text-ink hover:brightness-110" : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {paying ? "Processing…" : `Pay ${PRODUCT.currency}${total.toLocaleString("en-IN")}`}
              </button>
              <p className="font-mono text-[10px] text-muted-foreground text-center">
                Payments secured by Razorpay. Live gateway wires up with Cloud.
              </p>
            </div>
          </aside>
        </motion.div>
      </div>
    </main>
  );
}
