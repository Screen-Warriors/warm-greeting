import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, ShieldCheck, Truck, RefreshCw, Ruler, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart-store";
import { PRODUCT, SIZE_CHART, IMAGES, type Size } from "@/lib/product";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function SizeGuideModal() {
  return (
    <Dialog>
      <DialogTrigger id="size-guide-trigger" asChild>
        <button className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.24em] uppercase text-foreground/70 hover:text-foreground border-b border-foreground/20 hover:border-foreground pb-0.5 transition-colors">
          <Ruler className="w-3 h-3" strokeWidth={1.5} /> Size Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="display-h text-3xl">Fit & Sizing</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          The crewneck is cut for an oversized silhouette. Between sizes? Size down for a
          cleaner fit, or take your usual size for the full boxy look.
        </p>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 kicker">Size</th>
                <th className="text-right py-3 kicker">Chest (cm)</th>
                <th className="text-right py-3 kicker">Length</th>
                <th className="text-right py-3 kicker">Shoulder</th>
                <th className="text-right py-3 kicker">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_CHART.map((r) => (
                <tr key={r.size} className="border-b border-border/50">
                  <td className="py-3 font-display text-lg">{r.size}</td>
                  <td className="py-3 text-right font-mono">{r.chest}</td>
                  <td className="py-3 text-right font-mono">{r.length}</td>
                  <td className="py-3 text-right font-mono">{r.shoulder}</td>
                  <td className="py-3 text-right font-mono">{r.sleeve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">All measurements are garment-flat. Allow ±1cm.</p>
      </DialogContent>
    </Dialog>
  );
}

export function PurchasePanel() {
  const { add, setOpen } = useCart();
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const stockForSize = size ? PRODUCT.stockBySize[size] : null;
  const outOfStock = stockForSize === 0;

  const handleAdd = (buyNow = false) => {
    if (!size) {
      toast.error("Pick a size first.");
      return;
    }
    if (outOfStock) return;
    setAdding(true);
    add({
      productId: PRODUCT.id,
      name: PRODUCT.name,
      size,
      color: PRODUCT.colors[0].name,
      price: PRODUCT.price,
      quantity: qty,
      image: IMAGES.front,
    });
    setTimeout(() => setAdding(false), 900);
    if (buyNow) {
      setOpen(true);
    } else {
      toast.success(`Added to cart · ${size} × ${qty}`);
    }
  };

  return (
    <section id="purchase" className="relative py-24 md:py-32 border-t border-border grain">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-12 items-start">
          {/* Product images stack */}
          <div className="col-span-12 lg:col-span-7 space-y-3 md:space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9 }}
              className="aspect-[4/5] bg-muted overflow-hidden"
            >
              <img src={IMAGES.front} alt="Front view" className="w-full h-full object-cover" loading="lazy" />
            </motion.div>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.1 }} className="aspect-[4/5] bg-muted overflow-hidden">
                <img src={IMAGES.back} alt="Back view" className="w-full h-full object-cover" loading="lazy" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.2 }} className="aspect-[4/5] bg-muted overflow-hidden">
                <img src={IMAGES.leaning} alt="Styled on model" className="w-full h-full object-cover object-[center_top]" loading="lazy" />
              </motion.div>
            </div>
          </div>

          {/* Purchase card - sticky on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="col-span-12 lg:col-span-5 lg:sticky lg:top-28"
          >
            <div className="border border-border bg-card/40 backdrop-blur p-6 md:p-8 space-y-6">
              <div>
                <p className="kicker mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ember animate-pulse" />
                  In stock · Drop 001
                </p>
                <h1 className="display-h text-3xl md:text-4xl leading-none">{PRODUCT.name}</h1>
                <p className="mt-3 kicker text-muted-foreground">{PRODUCT.sku}</p>
              </div>

              <p className="text-sm leading-relaxed text-foreground/80">{PRODUCT.description}</p>

              <div className="flex items-baseline gap-3 pt-4 border-t border-border">
                <span className="font-display text-3xl">{PRODUCT.currency}{PRODUCT.price.toLocaleString("en-IN")}</span>

                <span className="font-mono text-sm line-through text-muted-foreground">{PRODUCT.currency}{PRODUCT.compareAt.toLocaleString("en-IN")}</span>
                <span className="ml-auto kicker text-ember">Save 75%</span>
              </div>

              {/* Color */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="kicker">Colour</p>
                  <p className="font-mono text-xs">{PRODUCT.colors[0].name}</p>
                </div>
                <div className="flex gap-2">
                  {PRODUCT.colors.map((c) => (
                    <button
                      key={c.name}
                      className="relative w-10 h-10 border border-ember ring-1 ring-inset ring-background"
                      style={{ background: c.value }}
                      aria-label={c.name}
                    >
                      <Check className="w-3 h-3 text-ember absolute -top-1 -right-1 bg-background rounded-full p-0.5" strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="kicker">Size</p>
                  <SizeGuideModal />
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {PRODUCT.sizes.map((s) => {
                    const stk = PRODUCT.stockBySize[s];
                    const dis = stk === 0;
                    const active = size === s;
                    return (
                      <button
                        key={s}
                        disabled={dis}
                        onClick={() => setSize(s)}
                        className={cn(
                          "relative h-12 border font-mono text-sm transition-all",
                          dis && "opacity-30 cursor-not-allowed line-through",
                          active ? "border-ember bg-ember text-ink" : "border-border hover:border-foreground",
                        )}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
                {size && (
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    {outOfStock ? (
                      <span className="text-destructive">Out of stock in {size}.</span>
                    ) : stockForSize! <= 5 ? (
                      <span className="text-ember">Only {stockForSize} left in {size}.</span>
                    ) : (
                      <span>{stockForSize} available in {size}.</span>
                    )}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <p className="kicker mb-3">Quantity</p>
                <div className="inline-flex items-center border border-border">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-11 h-11 grid place-items-center hover:bg-foreground/5" aria-label="Decrease">
                    <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                  <span className="w-12 text-center font-mono">{qty}</span>
                  <button onClick={() => setQty((q) => q + 1)} className="w-11 h-11 grid place-items-center hover:bg-foreground/5" aria-label="Increase">
                    <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => handleAdd(false)}
                  disabled={outOfStock}
                  className={cn(
                    "btn-magnetic relative w-full h-14 font-mono text-[11px] tracking-[0.28em] uppercase overflow-hidden border",
                    outOfStock ? "border-border text-muted-foreground cursor-not-allowed"
                    : "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background transition-colors"
                  )}
                >
                  <span className={cn("inline-flex items-center gap-2 transition-transform", adding && "-translate-y-full")}>Add to cart</span>
                  <span className={cn("absolute inset-0 inline-flex items-center justify-center gap-2 transition-transform", adding ? "translate-y-0" : "translate-y-full")}>
                    <Check className="w-3.5 h-3.5" /> Added
                  </span>
                </button>
                <button
                  onClick={() => handleAdd(true)}
                  disabled={outOfStock}
                  className={cn(
                    "btn-magnetic w-full h-14 font-mono text-[11px] tracking-[0.28em] uppercase transition-all",
                    outOfStock ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-ember text-ink hover:brightness-110"
                  )}
                >
                  {outOfStock ? "Sold out" : "Buy now →"}
                </button>
              </div>

              {/* Trust row */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border">
                {[
                  { i: <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />, t: "Secure", s: "Razorpay" },
                  { i: <Truck className="w-4 h-4" strokeWidth={1.5} />, t: "48h dispatch", s: "Bengaluru" },
                  { i: <RefreshCw className="w-4 h-4" strokeWidth={1.5} />, t: "7-day returns", s: "Free exchange" },
                ].map((x) => (
                  <div key={x.t} className="text-center space-y-1.5">
                    <span className="inline-flex text-ember">{x.i}</span>
                    <p className="font-mono text-[10px] tracking-[0.2em] uppercase">{x.t}</p>
                    <p className="text-[10px] text-muted-foreground">{x.s}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
