import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-store";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export function CartDrawer() {
  const { items, open, setOpen, remove, updateQty, subtotal, count } = useCart();

  const goCheckout = () => {
    toast.info("Checkout is wired in the next phase (Razorpay + Cloud).");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-background border-l border-border p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="flex items-center justify-between">
            <span className="display-h text-2xl">Your bag <span className="text-ember">/ {count}</span></span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="w-8 h-8 text-muted-foreground mb-4" strokeWidth={1.2} />
            <p className="display-h text-2xl mb-2">Empty for now.</p>
            <p className="text-sm text-muted-foreground mb-6">Add the signature crewneck to get started.</p>
            <button onClick={() => setOpen(false)} className="border border-foreground/30 px-5 py-3 font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-foreground hover:text-background transition-colors">
              Continue browsing
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-border">
              {items.map((it) => (
                <div key={it.id} className="p-5 flex gap-4">
                  <div className="w-20 h-24 shrink-0 bg-muted overflow-hidden">
                    <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <p className="font-display text-lg leading-tight">{it.name}</p>
                      <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                        <X className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                    <p className="kicker mt-1 text-muted-foreground">Size {it.size} · {it.color}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-border">
                        <button onClick={() => updateQty(it.id, it.quantity - 1)} className="w-8 h-8 grid place-items-center hover:bg-foreground/5"><Minus className="w-3 h-3" strokeWidth={1.5} /></button>
                        <span className="w-8 text-center font-mono text-sm">{it.quantity}</span>
                        <button onClick={() => updateQty(it.id, it.quantity + 1)} className="w-8 h-8 grid place-items-center hover:bg-foreground/5"><Plus className="w-3 h-3" strokeWidth={1.5} /></button>
                      </div>
                      <p className="font-display text-lg">₹{(it.price * it.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border p-6 space-y-4 bg-card/40">
              <div className="flex items-baseline justify-between">
                <span className="kicker">Subtotal</span>
                <span className="font-display text-3xl">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">Shipping and taxes calculated at checkout.</p>
              <button
                onClick={goCheckout}
                className="w-full h-14 bg-ember text-ink font-mono text-[11px] tracking-[0.28em] uppercase hover:brightness-110 transition-all inline-flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
              <button onClick={() => setOpen(false)} className="w-full font-mono text-[11px] tracking-[0.28em] uppercase text-muted-foreground hover:text-foreground py-2">
                Keep browsing
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
