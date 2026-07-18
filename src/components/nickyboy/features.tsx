import { motion } from "framer-motion";
import { Layers, Ruler, Scissors, Palette, Package, Sparkles } from "lucide-react";

const FEATURES = [
  { icon: Layers,   title: "380 GSM heavyweight",  body: "Brushed cotton fleece, garment-dyed for depth." },
  { icon: Scissors, title: "Drop-shoulder cut",    body: "Boxy, oversized silhouette. Pattern-cut in-house." },
  { icon: Ruler,    title: "Ribbed contrast trims", body: "Bone-white 2×1 ribbing at collar, cuffs, hem." },
  { icon: Palette,  title: "Hand-pulled screen print", body: "Plastisol on garment. Won't crack, won't fade." },
  { icon: Package,  title: "Signed & numbered",    body: "Every piece ships with a numbered NB dog-tag." },
  { icon: Sparkles, title: "Made in Bengaluru",    body: "Cut, sewn and printed by a single studio team." },
];

export function Features() {
  return (
    <section className="py-24 md:py-32 border-t border-border bg-[#080808]">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mb-14"
        >
          <p className="kicker mb-3"><span className="text-ember">◆</span> Chapter 03 / Fabric & fit</p>
          <h2 className="display-h text-5xl md:text-7xl">Built to<br/>outlast the drop.</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-border">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
              className="border-r border-b border-border p-8 md:p-10 group hover:bg-card transition-colors"
            >
              <f.icon className="w-6 h-6 text-ember mb-6 group-hover:scale-110 transition-transform origin-left" strokeWidth={1.4} />
              <p className="kicker mb-2 text-foreground/50">0{i + 1}</p>
              <h3 className="font-display text-2xl mb-3 leading-tight">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
