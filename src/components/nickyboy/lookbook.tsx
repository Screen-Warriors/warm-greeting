import { motion } from "framer-motion";
import { IMAGES } from "@/lib/product";

const LOOKS = [
  { src: IMAGES.hero,     caption: "Solo · with cargo",   sub: "Concrete stairwell / 09.03" },
  { src: IMAGES.sitting,  caption: "Coffee run",           sub: "Weekend / bengaluru" },
  { src: IMAGES.leaning,  caption: "With dog-tag chain",   sub: "Layered under jacket" },
];

export function Lookbook() {
  return (
    <section className="py-24 md:py-32 border-t border-border bg-[#080808]">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-12 flex items-end justify-between flex-wrap gap-4"
        >
          <div>
            <p className="kicker mb-3"><span className="text-ember">◆</span> Chapter 05 / Styled with</p>
            <h2 className="display-h text-5xl md:text-7xl">On the street.</h2>
          </div>
          <p className="hand text-ember text-2xl md:text-3xl leading-none">— shot on 35mm</p>
        </motion.div>

        <div className="grid grid-cols-12 gap-4">
          {LOOKS.map((l, i) => (
            <motion.figure
              key={l.src + i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 md:col-span-4 group"
            >
              <div className="aspect-[3/4] overflow-hidden bg-muted relative">
                <img src={l.src} alt={l.caption} loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-40 group-hover:opacity-70 transition-opacity" />
                <span className="absolute top-4 left-4 kicker bg-background/70 px-2 py-1 backdrop-blur">Look 0{i + 1}</span>
              </div>
              <figcaption className="mt-4 flex justify-between items-baseline">
                <span className="font-display text-2xl">{l.caption}</span>
                <span className="kicker text-muted-foreground">{l.sub}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
