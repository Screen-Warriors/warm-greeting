import { ShieldCheck, Truck, RefreshCw, Package, Wallet, MapPin, Sparkles } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Secure Checkout", sub: "Razorpay verified" },
  { icon: Wallet, label: "COD Available", sub: "Pan-India" },
  { icon: Truck, label: "Free Shipping", sub: "Over ₹2,000" },
  { icon: RefreshCw, label: "7-Day Returns", sub: "Free exchange" },
  { icon: Package, label: "Premium Packaging", sub: "Numbered dog-tag" },
  { icon: MapPin, label: "Made in India", sub: "Bengaluru studio" },
  { icon: Sparkles, label: "Limited Edition", sub: "Run of 300" },
];

export function TrustBar() {
  return (
    <section aria-label="Buyer guarantees" className="border-y border-border bg-[#0a0a0a]">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10 py-6 md:py-8">
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-x-6 gap-y-5">
          {ITEMS.map((t) => (
            <li key={t.label} className="flex items-center gap-3 group">
              <span className="w-9 h-9 shrink-0 grid place-items-center border border-border group-hover:border-ember/60 group-hover:text-ember transition-colors">
                <t.icon className="w-4 h-4" strokeWidth={1.4} />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[0.22em] uppercase truncate">{t.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{t.sub}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
