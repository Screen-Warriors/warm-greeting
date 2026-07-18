import { motion } from "framer-motion";
import { IMAGES } from "@/lib/product";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MarqueeBar() {
  const items = ["Free shipping over ₹2000", "Ships from Bengaluru", "Cash on delivery available", "Limited to 300 pieces", "48h dispatch"];
  const track = [...items, ...items, ...items];
  return (
    <div className="border-y border-border bg-[#0d0d0d] overflow-hidden py-4">
      <div className="marquee-track flex gap-12 whitespace-nowrap">
        {track.map((t, i) => (
          <span key={i} className="kicker text-foreground/60 flex items-center gap-12">
            {t} <span className="text-ember">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Story() {
  return (
    <section id="story" className="relative py-24 md:py-40 grain">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="grid grid-cols-12 gap-6 md:gap-12"
        >
          <motion.aside variants={fadeUp} className="col-span-12 md:col-span-4 md:sticky md:top-32 self-start">
            <p className="kicker mb-6"><span className="text-ember">◆</span> Chapter 01 / Concept</p>
            <h2 className="display-h text-6xl md:text-7xl lg:text-8xl leading-[0.86]">
              A silent<br/>character<br/><span className="text-ember">in ink.</span>
            </h2>
          </motion.aside>

          <motion.div variants={fadeUp} className="col-span-12 md:col-span-4 space-y-6 md:pt-8">
            <p className="text-lg md:text-xl leading-relaxed text-foreground/85">
              NICKY BOY started as a sketchbook character — a boy drawn between panels,
              never quite the main story. On the front of the crewneck he returns as a
              half-face silhouette, cropped low, looking off the frame.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              The column of runes down the chest isn't a language. It's the private
              alphabet the character used to write in the margins of every page —
              symbols that mean whatever you're carrying when you wear them.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              The fit is boxy on purpose. Drop-shouldered, cropped just above the hip,
              cut so the graphic sits centred over the sternum. Bone-white ribbing at
              the collar, cuff and hem. A hand-drawn wordmark tucked at the hem, small
              enough that only you know it's there.
            </p>
            <div className="pt-4 flex items-center gap-6 border-t border-border">
              <div>
                <p className="kicker mb-1">Made in</p>
                <p className="font-display text-2xl leading-none">Bengaluru</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="kicker mb-1">Run of</p>
                <p className="font-display text-2xl leading-none">300 pcs</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="kicker mb-1">Drop</p>
                <p className="font-display text-2xl leading-none">001</p>
              </div>
            </div>
          </motion.div>

          <motion.figure variants={fadeUp} className="col-span-12 md:col-span-4 relative">
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={IMAGES.detail}
                alt="Close-up of the hand-drawn print detail on the crewneck"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <figcaption className="mt-4 kicker text-foreground/60 flex items-center justify-between">
              <span>Fig. 01 / Print detail</span>
              <span className="hand text-lg text-ember">— hand-pulled</span>
            </figcaption>
          </motion.figure>
        </motion.div>
      </div>
    </section>
  );
}
