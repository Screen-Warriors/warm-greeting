import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowDown } from "lucide-react";
import { IMAGES } from "@/lib/product";

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  return (
    <section ref={ref} className="relative min-h-[100svh] w-full overflow-hidden grain bg-[#050505]">
      {/* Background image */}
      <motion.div style={{ y, scale }} className="absolute inset-0 z-0">
        <img
          src={IMAGES.hero}
          alt="Model wearing the NICKY BOY signature crewneck"
          className="w-full h-full object-cover object-[50%_15%] md:object-[50%_22%] opacity-95"
          fetchPriority="high"
        />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/30 md:from-background/60 md:to-transparent" />
      </motion.div>

      {/* Top runner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="absolute top-24 md:top-28 left-5 md:left-10 z-10 flex items-center gap-3"
      >
        <span className="w-8 h-px bg-ember" />
        <span className="kicker text-foreground/80">The Signature Drop / 001</span>
      </motion.div>

      {/* Content */}
      <motion.div style={{ opacity }} className="relative z-10 mx-auto max-w-[1600px] px-5 md:px-10 pt-40 md:pt-48 pb-24 min-h-[100svh] flex flex-col justify-end">
        <div className="grid grid-cols-12 gap-4 items-end">
          <div className="col-span-12 md:col-span-8 lg:col-span-9">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="kicker mb-6"
            >
              Heavyweight cotton / Hand-drawn graphic / Limited run
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="display-h text-[22vw] md:text-[15vw] lg:text-[13vw] xl:text-[220px] leading-[0.82] text-bone tracking-[-0.03em]"
              style={{ textShadow: "0 8px 60px rgba(0,0,0,0.5)" }}
            >
              Nicky
              <br />
              <span className="inline-flex items-baseline gap-4 md:gap-6">
                Boy
                <span className="hand text-ember text-[10vw] md:text-[6vw] lg:text-[5vw] xl:text-[80px] leading-none translate-y-[-0.08em]">
                  ˙001
                </span>
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.9 }}
              className="mt-8 md:mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8"
            >
              <a
                href="#purchase"
                className="group relative inline-flex items-center gap-3 bg-bone text-ink px-8 py-4 font-mono text-[11px] tracking-[0.28em] uppercase overflow-hidden hover:bg-ember transition-colors duration-500"
              >
                <span className="relative z-10">Shop the drop</span>
                <span className="relative z-10 inline-block group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a href="#story" className="font-mono text-[11px] tracking-[0.28em] uppercase text-foreground/70 hover:text-foreground transition-colors border-b border-foreground/20 hover:border-foreground pb-1">
                Read the story
              </a>
            </motion.div>
          </div>

          {/* Right-side price card */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1, duration: 0.9 }}
            className="hidden md:block col-span-4 lg:col-span-3 border-l border-foreground/20 pl-6 space-y-3"
          >
            <p className="kicker">SKU · NB—001</p>
            <p className="font-mono text-[11px] leading-relaxed text-foreground/70">
              Garment-dyed <br/>
              matte-black fleece <br/>
              screen-printed by hand <br/>
              in Bengaluru.
            </p>
            <div className="pt-3 border-t border-foreground/10 flex items-baseline gap-2">
              <span className="font-display text-3xl text-bone">₹2,499</span>
              <span className="font-mono text-[11px] line-through text-muted-foreground">₹3,299</span>
            </div>
          </motion.aside>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#story"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
      >
        <span className="kicker">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="w-4 h-4" strokeWidth={1.5} />
        </motion.div>
      </motion.a>
    </section>
  );
}
