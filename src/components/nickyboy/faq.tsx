import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ } from "@/lib/product";

export function FaqSection() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-6 md:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="col-span-12 md:col-span-4"
          >
            <p className="kicker mb-3"><span className="text-ember">◆</span> Chapter 06 / Details</p>
            <h2 className="display-h text-5xl md:text-6xl leading-[0.9] mb-6">
              Everything<br/>you'd ask.
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Something not covered? Slide into <a href="mailto:care@nickyboy.co" className="text-ember hover:underline">care@nickyboy.co</a> — we reply within 12 hours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="col-span-12 md:col-span-8"
          >
            <Accordion type="single" collapsible className="w-full">
              {FAQ.map((f, i) => (
                <AccordionItem key={f.q} value={`item-${i}`} className="border-b border-border py-2">
                  <AccordionTrigger className="text-left font-display text-xl md:text-2xl hover:no-underline hover:text-ember transition-colors py-6">
                    <span className="flex items-baseline gap-4">
                      <span className="kicker text-muted-foreground shrink-0">0{i + 1}</span>
                      <span>{f.q}</span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-foreground/75 leading-relaxed pl-12 pb-6">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
