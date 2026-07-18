import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Lock, ShieldCheck, Wallet, Truck, RotateCcw, CreditCard, Check, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "@/integrations/supabase/client";
import { loadRazorpay, openRazorpay, type RazorpayHandlerResponse } from "@/lib/razorpay";

export const Route = createFileRoute("/checkout")({ component: Checkout });

const RZP_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID as string;
const COD_FEE = 50;

type PaymentMethod = "razorpay" | "cod";

type FormState = {
  email: string; name: string; phone: string;
  address: string; city: string; state: string; pincode: string;
};

type FieldError = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): FieldError {
  const e: FieldError = {};
  if (!f.email) e.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Enter a valid email";
  if (!f.name.trim()) e.name = "Required";
  if (!f.phone) e.phone = "Required";
  else if (!/^(\+?\d{10,13})$/.test(f.phone)) e.phone = "10–13 digits";
  if (!f.address.trim()) e.address = "Required";
  if (!f.city.trim()) e.city = "Required";
  if (!f.state.trim()) e.state = "Required";
  if (!f.pincode) e.pincode = "Required";
  else if (!/^\d{6}$/.test(f.pincode)) e.pincode = "6 digits";
  return e;
}

function Field({
  label, id, type = "text", value, onChange, placeholder, autoComplete, className, error, onBlur,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
  className?: string; error?: string; onBlur?: () => void;
}) {
  return (
    <label htmlFor={id} className={cn("block group", className)}>
      <span className="kicker block mb-2">{label}</span>
      <input
        id={id} type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder} autoComplete={autoComplete}
        className={cn(
          "w-full h-11 bg-background/40 backdrop-blur border rounded-md px-3.5 font-mono text-sm",
          "outline-none transition-all",
          error
            ? "border-destructive/70 focus:border-destructive focus:ring-2 focus:ring-destructive/20"
            : "border-border/70 focus:border-ember focus:ring-2 focus:ring-ember/25 hover:border-border",
        )}
      />
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] tracking-wider uppercase text-destructive"
          >
            <AlertCircle className="w-3 h-3" strokeWidth={1.8} /> {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

function PayOption({
  selected, onSelect, icon, title, tagline, badge, note,
}: {
  selected: boolean; onSelect: () => void;
  icon: React.ReactNode; title: string; tagline: string;
  badge?: string; note?: string;
}) {
  return (
    <button
      type="button" onClick={onSelect}
      className={cn(
        "relative w-full text-left rounded-xl border p-4 md:p-5 transition-all",
        "backdrop-blur bg-card/30 hover:bg-card/50",
        selected
          ? "border-ember shadow-[0_0_0_1px_var(--ember),0_8px_30px_-10px_color-mix(in_oklab,var(--ember)_60%,transparent)]"
          : "border-border/70 hover:border-foreground/50",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className={cn(
          "mt-0.5 w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 transition-colors",
          selected ? "border-ember" : "border-foreground/40",
        )}>
          <AnimatePresence>
            {selected && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="w-2.5 h-2.5 rounded-full bg-ember"
              />
            )}
          </AnimatePresence>
        </span>
        <span className={cn("shrink-0 w-9 h-9 rounded-lg border grid place-items-center transition-colors",
          selected ? "border-ember/60 text-ember" : "border-border text-foreground/70")}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display text-base leading-none">{title}</p>
            {badge && (
              <span className="font-mono text-[9px] tracking-[0.22em] uppercase px-1.5 py-0.5 rounded bg-ember/15 text-ember border border-ember/30">
                {badge}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{tagline}</p>
          {note && <p className="mt-1.5 font-mono text-[10px] tracking-wider uppercase text-foreground/60">{note}</p>}
        </div>
      </div>
    </button>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotal, count, clear } = useCart();
  const [f, setF] = useState<FormState>({
    email: "", name: "", phone: "", address: "", city: "", state: "", pincode: "",
  });
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [paying, setPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errors = useMemo(() => validate(f), [f]);
  const shownErrors = useMemo<FieldError>(() => {
    const out: FieldError = {};
    (Object.keys(errors) as Array<keyof FormState>).forEach((k) => {
      if (touched[k]) out[k] = errors[k];
    });
    return out;
  }, [errors, touched]);

  const shipping = subtotal >= 2500 ? 0 : 99;
  const codFee = method === "cod" ? COD_FEE : 0;
  const discount = 0;
  const total = subtotal + shipping + codFee - discount;

  const formValid = Object.keys(errors).length === 0;
  const canPay = items.length > 0 && formValid;

  const setField = (k: keyof FormState, v: string) => setF((p) => ({ ...p, [k]: v }));
  const touchAll = () =>
    setTouched({ email: true, name: true, phone: true, address: true, city: true, state: true, pincode: true });

  const invokeFn = async <T,>(name: string, body: unknown): Promise<T> => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (json?.error === "razorpay_auth_failed") {
        throw new Error(
          "Razorpay rejected the API credentials saved in Supabase. Re-save a matching TEST Key ID and TEST Secret in Edge Function secrets, then retry.",
        );
      }
      const detail = typeof json?.detail?.description === "string" ? `: ${json.detail.description}` : "";
      throw new Error(`${json?.error ?? `request_failed_${res.status}`}${detail}`);
    }
    return json as T;
  };

  const orderPayload = () => ({
    items: items.map((i) => ({ product_id: i.productId, size: i.size, quantity: i.quantity })),
    customer: { name: f.name, email: f.email, phone: f.phone },
    shipping: { address: f.address, city: f.city, state: f.state, pincode: f.pincode, country: "IN" },
  });

  const stashReceipt = (orderId: string, order: Record<string, unknown>) => {
    sessionStorage.setItem(
      `nb_order_${orderId}`,
      JSON.stringify({
        order,
        shipping: { address: f.address, city: f.city, state: f.state, pincode: f.pincode },
      }),
    );
  };

  const payWithRazorpay = async () => {
    await loadRazorpay();
    const created = await invokeFn<{
      order_id: string; razorpay_order_id: string; amount: number; currency: string; key_id: string;
    }>("create-razorpay-order", orderPayload());

    openRazorpay({
      key: created.key_id || RZP_KEY_ID,
      amount: created.amount,
      currency: created.currency,
      name: "NICKY BOY",
      description: "Signature Crewneck / Drop 001",
      order_id: created.razorpay_order_id,
      prefill: { name: f.name, email: f.email, contact: f.phone },
      theme: { color: "#0A0A0A" },
      handler: async (r: RazorpayHandlerResponse) => {
        try {
          const verified = await invokeFn<{ ok: boolean; order: Record<string, unknown> & { id: string } }>(
            "verify-razorpay-payment", r,
          );
          if (!verified?.ok) throw new Error("verify_failed");
          stashReceipt(verified.order.id, verified.order);
          clear();
          navigate({ to: "/order/$orderId", params: { orderId: verified.order.id } });
        } catch {
          setErrorMsg("We received your payment but couldn't confirm it here. Our team will verify shortly.");
          toast.error("Verification failed — we're on it.");
        } finally {
          setPaying(false);
        }
      },
      modal: {
        ondismiss: () => {
          setPaying(false);
          setErrorMsg("Payment cancelled. You can try again anytime.");
          toast("Payment cancelled.");
        },
      },
    });
  };

  const placeCod = async () => {
    const res = await invokeFn<{ ok: boolean; order: Record<string, unknown> & { id: string } }>(
      "create-cod-order", orderPayload(),
    );
    if (!res.ok) throw new Error("cod_failed");
    stashReceipt(res.order.id, res.order);
    clear();
    toast.success("Cash on Delivery order placed.");
    navigate({ to: "/order/$orderId", params: { orderId: res.order.id } });
  };

  const submit = async () => {
    touchAll();
    if (!canPay) { toast.error("Fix the highlighted fields."); return; }
    setErrorMsg(null);
    setPaying(true);
    try {
      if (method === "razorpay") await payWithRazorpay();
      else await placeCod();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(`Could not place order (${msg}).`);
      toast.error("Could not place order.");
      setPaying(false);
    }
  };

  const currency = PRODUCT.currency;
  const eta = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + (method === "cod" ? 6 : 4));
    const d2 = new Date();
    d2.setDate(d2.getDate() + (method === "cod" ? 9 : 6));
    const fmt = (x: Date) => x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return `${fmt(d)} – ${fmt(d2)}`;
  }, [method]);

  return (
    <main className="min-h-screen bg-background text-foreground grain">
      <div className="mx-auto max-w-[1240px] px-5 md:px-10 py-6 md:py-10 pb-32 lg:pb-10">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/70 hover:text-foreground transition-colors">
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
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="grid grid-cols-12 gap-6 lg:gap-10"
        >
          {/* LEFT */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            {/* Shipping */}
            <section>
              <div className="mb-5">
                <p className="kicker mb-1.5"><span className="text-ember">◆</span> Step 01</p>
                <h1 className="display-h text-3xl md:text-4xl leading-none">Shipping</h1>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <Field className="col-span-2" label="Email" id="email" type="email" autoComplete="email"
                  value={f.email} onChange={(v) => setField("email", v)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  error={shownErrors.email} placeholder="you@domain.com" />
                <Field label="Full name" id="name" autoComplete="name"
                  value={f.name} onChange={(v) => setField("name", v)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  error={shownErrors.name} placeholder="Nicky Boy" />
                <Field label="Phone" id="phone" type="tel" autoComplete="tel"
                  value={f.phone} onChange={(v) => {
                    const cleaned = v.replace(/[^\d+]/g, "");
                    const normalized = cleaned.startsWith("+")
                      ? "+" + cleaned.slice(1).replace(/\+/g, "").slice(0, 12)
                      : cleaned.replace(/\+/g, "").slice(0, 10);
                    setField("phone", normalized);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  error={shownErrors.phone} placeholder="+91" />
                <Field className="col-span-2" label="Address" id="address" autoComplete="street-address"
                  value={f.address} onChange={(v) => setField("address", v)}
                  onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                  error={shownErrors.address} placeholder="Street, apt, landmark" />
                <Field label="City" id="city" autoComplete="address-level2"
                  value={f.city} onChange={(v) => setField("city", v)}
                  onBlur={() => setTouched((t) => ({ ...t, city: true }))}
                  error={shownErrors.city} />
                <Field label="State" id="state" autoComplete="address-level1"
                  value={f.state} onChange={(v) => setField("state", v)}
                  onBlur={() => setTouched((t) => ({ ...t, state: true }))}
                  error={shownErrors.state} />
                <Field className="col-span-2 sm:col-span-1" label="Pincode" id="pincode" autoComplete="postal-code"
                  value={f.pincode} onChange={(v) => setField("pincode", v.replace(/\D/g, "").slice(0, 6))}
                  onBlur={() => setTouched((t) => ({ ...t, pincode: true }))}
                  error={shownErrors.pincode} />
              </div>
            </section>

            {/* Payment */}
            <section>
              <div className="mb-5">
                <p className="kicker mb-1.5"><span className="text-ember">◆</span> Step 02</p>
                <h2 className="display-h text-3xl md:text-4xl leading-none">Payment</h2>
              </div>
              <div className="space-y-3">
                <PayOption
                  selected={method === "razorpay"}
                  onSelect={() => setMethod("razorpay")}
                  icon={<CreditCard className="w-4 h-4" strokeWidth={1.6} />}
                  title="Razorpay"
                  tagline="UPI · Credit / Debit Cards · Net Banking · Wallets"
                  badge="Recommended"
                  note="Encrypted payment powered by Razorpay."
                />
                <PayOption
                  selected={method === "cod"}
                  onSelect={() => setMethod("cod")}
                  icon={<Wallet className="w-4 h-4" strokeWidth={1.6} />}
                  title="Cash on Delivery"
                  tagline="Pay when your package arrives."
                  note={`Additional ${currency}${COD_FEE} COD handling fee`}
                />
              </div>

              {errorMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 font-mono text-[11px] text-destructive border border-destructive/40 rounded-md p-3"
                >
                  {errorMsg}
                </motion.p>
              )}

              {/* Trust badges */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: <Lock className="w-3.5 h-3.5" />, label: "Secure Checkout" },
                  { icon: <Truck className="w-3.5 h-3.5" />, label: "Fast Shipping" },
                  { icon: <RotateCcw className="w-3.5 h-3.5" />, label: "Easy Returns" },
                  { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Safe Payments" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2 border border-border/60 rounded-md px-3 py-2.5 bg-card/20 backdrop-blur">
                    <span className="text-ember">{b.icon}</span>
                    <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground/80">{b.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT — Order summary */}
          <aside className="col-span-12 lg:col-span-5">
            <div className="lg:sticky lg:top-6 rounded-xl border border-border/70 bg-card/40 backdrop-blur-md p-5 md:p-6 space-y-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]">
              <div className="flex items-baseline justify-between">
                <h2 className="display-h text-2xl">Order</h2>
                <span className="kicker">{count} item{count === 1 ? "" : "s"}</span>
              </div>

              <div className="max-h-[240px] overflow-y-auto divide-y divide-border/60 -mx-1">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1 py-3">
                    Your bag is empty. <Link to="/" className="text-ember underline">Go back</Link>.
                  </p>
                ) : items.map((it) => (
                  <div key={it.id} className="flex gap-3 py-3 px-1">
                    <div className="w-14 h-16 bg-muted rounded-md shrink-0 overflow-hidden">
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm leading-tight truncate">{it.name}</p>
                      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                        Size {it.size} · Qty {it.quantity}
                      </p>
                    </div>
                    <p className="font-mono text-xs shrink-0">
                      {currency}{(it.price * it.quantity).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/60 pt-4 space-y-2 font-mono text-xs">
                <Row label="Subtotal" value={`${currency}${subtotal.toLocaleString("en-IN")}`} />
                <Row label="Shipping" value={shipping === 0 ? "Free" : `${currency}${shipping}`} />
                {method === "cod" && <Row label="COD fee" value={`${currency}${codFee}`} />}
                {discount > 0 && <Row label="Discount" value={`− ${currency}${discount}`} accent />}
                <Row label="Payment" value={method === "razorpay" ? "Razorpay" : "Cash on Delivery"} muted />
                <Row label="Est. delivery" value={eta} muted />
                <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-border/60">
                  <span className="kicker">Total</span>
                  <span className="font-display text-3xl">{currency}{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={submit}
                disabled={!canPay || paying}
                className={cn(
                  "hidden lg:block w-full h-12 rounded-md font-mono text-[11px] tracking-[0.28em] uppercase transition-all",
                  canPay && !paying
                    ? "bg-ember text-ink hover:brightness-110 shadow-[0_10px_30px_-10px_color-mix(in_oklab,var(--ember)_60%,transparent)]"
                    : "bg-muted text-muted-foreground cursor-not-allowed",
                )}
              >
                {paying
                  ? (method === "razorpay" ? "Opening Razorpay…" : "Placing order…")
                  : method === "razorpay"
                    ? `Pay ${currency}${total.toLocaleString("en-IN")}`
                    : `Place COD order · ${currency}${total.toLocaleString("en-IN")}`}
              </button>
              <p className="hidden lg:block font-mono text-[10px] text-muted-foreground text-center">
                {method === "razorpay" ? "Payments secured by Razorpay. INR only." : "Pay in cash when your package arrives."}
              </p>
            </div>
          </aside>
        </motion.div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-xl p-3.5 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 max-w-[720px] mx-auto">
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[9px] tracking-[0.24em] uppercase text-muted-foreground">
              {method === "razorpay" ? "Prepaid" : "Cash on Delivery"}
            </p>
            <p className="font-display text-xl leading-none mt-0.5">
              {currency}{total.toLocaleString("en-IN")}
            </p>
          </div>
          <button
            onClick={submit}
            disabled={!canPay || paying}
            className={cn(
              "h-12 px-5 rounded-md font-mono text-[11px] tracking-[0.28em] uppercase inline-flex items-center gap-2",
              canPay && !paying ? "bg-ember text-ink" : "bg-muted text-muted-foreground",
            )}
          >
            {paying ? "…" : method === "razorpay" ? "Pay now" : "Place order"}
            {!paying && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
          </button>
        </div>
      </div>
    </main>
  );
}

function Row({ label, value, muted, accent }: { label: string; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={cn(muted ? "text-muted-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn(accent && "text-ember")}>{value}</span>
    </div>
  );
}

void supabase;
