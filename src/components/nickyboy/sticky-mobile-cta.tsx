import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { PRODUCT } from "@/lib/product";
import { useLivePricing } from "@/lib/use-live-pricing";

export function StickyMobileCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const on = () => {
      // show after user scrolls past 80% of viewport height
      const trigger = window.innerHeight * 0.8;
      setShow(window.scrollY > trigger);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-2xl border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted-foreground truncate">
                NICKY BOY · Drop 001
              </p>
              <p className="font-display text-xl leading-none mt-1">
                {PRODUCT.currency}{PRODUCT.price.toLocaleString("en-IN")}
                <span className="font-mono text-[11px] ml-2 line-through text-muted-foreground">
                  {PRODUCT.currency}{PRODUCT.compareAt.toLocaleString("en-IN")}
                </span>
              </p>
            </div>
            <a
              href="#purchase"
              className="btn-magnetic inline-flex items-center gap-2 bg-ember text-ink px-5 h-12 font-mono text-[11px] tracking-[0.24em] uppercase"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.8} />
              Buy now
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
