import { motion } from "framer-motion";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { IMAGES } from "@/lib/product";
import { cn } from "@/lib/utils";
import { ZoomIn } from "lucide-react";

const shots = [
  { src: IMAGES.hero, label: "01 / On body", aspect: "aspect-[4/5]", caption: "Cotton fleece, matte black" },
  { src: IMAGES.front, label: "02 / Front", aspect: "aspect-[4/5]", caption: "Screen-printed graphic" },
  { src: IMAGES.detail, label: "03 / Detail", aspect: "aspect-square", caption: "Hand-pulled runes" },
  { src: IMAGES.back, label: "04 / Back", aspect: "aspect-[4/5]", caption: "Clean back, small logo" },
  { src: IMAGES.leaning, label: "05 / Street", aspect: "aspect-[4/5]", caption: "Bengaluru, September" },
];

export function Gallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
          <div>
            <p className="kicker mb-3"><span className="text-ember">◆</span> Chapter 02 / The garment</p>
            <h2 className="display-h text-5xl md:text-7xl">Look closer.</h2>
          </div>
          <p className="hidden md:block font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground max-w-xs text-right">
            Click any frame to enlarge. Every detail was shot straight — no retouch.
          </p>
        </div>

        <div className="grid grid-cols-12 auto-rows-[minmax(0,_1fr)] gap-3 md:gap-4">
          {shots.map((s, i) => {
            const spans = [
              "col-span-12 md:col-span-7",
              "col-span-6 md:col-span-5",
              "col-span-6 md:col-span-4",
              "col-span-12 md:col-span-4",
              "col-span-12 md:col-span-4",
            ];
            return (
              <motion.button
                key={s.src + i}
                onClick={() => setLightbox(i)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.8, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={cn(spans[i], "group relative overflow-hidden bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ember", s.aspect)}
              >
                <img src={s.src} alt={s.caption} loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="kicker bg-background/70 backdrop-blur px-2 py-1">{s.label}</span>
                  <span className="w-8 h-8 grid place-items-center bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </span>
                </div>
                <p className="absolute bottom-3 left-3 right-3 font-mono text-[10px] tracking-[0.24em] uppercase text-bone/90">
                  {s.caption}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-background border-border">
          {lightbox !== null && (
            <div className="relative">
              <img src={shots[lightbox].src} alt={shots[lightbox].caption}
                className="w-full max-h-[85vh] object-contain bg-[#050505]" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
                <p className="kicker">{shots[lightbox].label}</p>
                <p className="font-display text-2xl mt-1">{shots[lightbox].caption}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
