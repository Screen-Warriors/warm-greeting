import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Size Guide", href: "#size-guide-trigger" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQ", href: "#faq" },
];


export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, setOpen } = useCart();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-500",
          scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border" : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-[1600px] px-5 md:px-10 flex items-center justify-between h-16 md:h-20">
          <a href="#top" className="flex items-center gap-2 group">
            <span className="w-8 h-8 border border-foreground/60 grid place-items-center font-display text-sm leading-none tracking-tight group-hover:bg-foreground group-hover:text-background transition-colors">
              NB
            </span>
            <span className="hidden sm:inline font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/80">
              Nicky Boy
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-9">
            {NAV.map((n) => (
              <a key={n.label} href={n.href}
                className="font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/70 hover:text-foreground transition-colors relative group py-2">
                {n.label}
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-ember group-hover:w-full transition-all duration-500" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="relative flex items-center gap-2 px-3 py-2 hover:bg-foreground/5 transition-colors"
              aria-label={`Open cart, ${count} items`}
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase hidden sm:inline">Cart</span>
              <span className={cn(
                "font-mono text-[10px] leading-none min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full",
                count > 0 ? "bg-ember text-ink" : "bg-foreground/10 text-foreground/60"
              )}>{count}</span>
            </button>
            <button
              className="md:hidden p-2"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-border bg-background"
            >
              <div className="px-5 py-6 flex flex-col gap-1">
                {NAV.map((n) => (
                  <a key={n.label} href={n.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-3xl py-3 hover:text-ember transition-colors">
                    {n.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      <div id="top" />
    </>
  );
}
