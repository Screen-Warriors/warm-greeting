import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, Truck, Zap, Package, ShieldCheck } from "lucide-react";
import { IMAGES, PRODUCT } from "@/lib/product";
import { supabase } from "@/integrations/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;


export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const { data: stockData, isSuccess } = useQuery({
    queryKey: ["storefront", "product", PRODUCT.id, "stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("stock_by_size")
        .eq("id", PRODUCT.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const totalStock = isSuccess && stockData?.stock_by_size
    ? Object.values(stockData.stock_by_size as Record<string, number>)
        .reduce((a, b) => a + (Number(b) || 0), 0)
    : null;
  const showBadge = totalStock !== null;
  const soldOut = totalStock === 0;


  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] w-full overflow-hidden grain bg-[#050505]"
    >
      {/* Radial luxe lighting */}
      <div className="absolute inset-0 radial-lume opacity-70 pointer-events-none z-[1]" />

      {/* Split-screen: left content column shadow, right image */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <img
          src={IMAGES.hero}
          alt="Model wearing the NICKY BOY signature crewneck"
          className="w-full h-full object-cover object-[62%_15%] md:object-[62%_22%] opacity-[0.95]"
          fetchPriority="high"
        />
        {/* Cinematic gradients for split-screen legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent md:from-background md:via-background/50 md:to-transparent" />
      </motion.div>

      {/* Top runner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute top-24 md:top-28 left-5 md:left-10 z-10 flex items-center gap-3"
      >
        <span className="w-8 h-px bg-ember" />
        <span className="kicker text-foreground/80">The Signature Drop / 001</span>
      </motion.div>

      {/* Floating low-stock badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.7, ease: EASE }}
        className="hidden md:flex absolute top-28 right-10 z-10 items-center gap-3 pl-3 pr-4 py-2.5 bg-background/70 backdrop-blur-xl border border-ember/40"
        style={{ animation: "soft-float 4s ease-in-out infinite" }}
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-ember opacity-70 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-ember" />
        </span>
        <span className="font-mono text-[10px] tracking-[0.24em] uppercase">
          Only <span className="text-ember">{LOW_STOCK}</span> pieces left
        </span>
      </motion.div>

      {/* Content column */}
      <motion.div
        style={{ opacity, y: textY }}
        className="relative z-10 mx-auto max-w-[1600px] px-5 md:px-10 pt-40 md:pt-44 pb-24 min-h-[100svh] flex flex-col justify-end"
      >
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-8 lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
              className="kicker mb-6"
            >
              Heavyweight cotton / Hand-drawn graphic / Limited to 300
            </motion.p>

            {/* Mask-reveal display heading */}
            <h1
              className="display-h text-[20vw] md:text-[13vw] lg:text-[11vw] xl:text-[180px] leading-[0.82] text-bone tracking-[-0.03em]"
              style={{ textShadow: "0 8px 60px rgba(0,0,0,0.55)" }}
            >
              <span className="mask-reveal"><span style={{ animationDelay: "0.15s" }}>Nicky</span></span>
              <br />
              <span className="inline-flex items-baseline gap-4 md:gap-6">
                <span className="mask-reveal"><span style={{ animationDelay: "0.32s" }}>Boy</span></span>
                <span className="mask-reveal">
                  <span
                    style={{ animationDelay: "0.55s" }}
                    className="hand text-ember text-[10vw] md:text-[5.5vw] lg:text-[4.5vw] xl:text-[72px] leading-none"
                  >
                    ˙001
                  </span>
                </span>
              </span>
            </h1>

            {/* Price + delivery row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.8, ease: EASE }}
              className="mt-8 md:mt-10 flex flex-wrap items-baseline gap-x-6 gap-y-2"
            >
              <span className="font-display text-4xl md:text-5xl text-bone leading-none">
                {PRODUCT.currency}{PRODUCT.price.toLocaleString("en-IN")}
              </span>
              <span className="font-mono text-sm line-through text-muted-foreground">
                {PRODUCT.currency}{PRODUCT.compareAt.toLocaleString("en-IN")}
              </span>
              <span className="font-mono text-[10px] tracking-[0.24em] uppercase px-2 py-1 border border-ember/50 text-ember">
                Save 75%
              </span>
            </motion.div>

            {/* CTAs + trust chips */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
              className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
            >
              <a
                href="#purchase"
                className="btn-magnetic group relative inline-flex items-center gap-3 bg-ember text-ink px-8 py-4 font-mono text-[11px] tracking-[0.28em] uppercase overflow-hidden"
              >
                <span className="relative z-10">Buy now</span>
                <span className="relative z-10 inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="#story"
                className="font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/20 hover:border-foreground pb-1"
              >
                Read the story
              </a>
            </motion.div>

            {/* Trust chip row */}
            <motion.ul
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.8, ease: EASE }}
              className="mt-10 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] tracking-[0.22em] uppercase text-foreground/70"
            >
              <li className="inline-flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-ember" strokeWidth={1.6} /> Ships in 48h</li>
              <li className="inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-ember" strokeWidth={1.6} /> Free shipping</li>
              <li className="inline-flex items-center gap-2"><Package className="w-3.5 h-3.5 text-ember" strokeWidth={1.6} /> 7-day returns</li>
              <li className="inline-flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-ember" strokeWidth={1.6} /> Secure checkout</li>
            </motion.ul>
          </div>

          {/* Right-side spec card */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
            className="hidden lg:block col-span-4 lg:col-span-4 lg:col-start-9 border-l border-foreground/20 pl-6 space-y-3"
          >
            <p className="kicker">SKU · NB—001</p>
            <p className="font-mono text-[11px] leading-relaxed text-foreground/70">
              Garment-dyed matte-black fleece.<br/>
              Screen-printed by hand<br/>
              in Bengaluru — one run of 300.
            </p>
            <div className="pt-3 border-t border-foreground/10 space-y-1">
              <p className="kicker text-foreground/50">Limited drop</p>
              <p className="font-display text-2xl text-bone leading-none">300 / total</p>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#purchase"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
      >
        <span className="kicker">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown className="w-4 h-4" strokeWidth={1.5} />
        </motion.div>
      </motion.a>
    </section>
  );
}
