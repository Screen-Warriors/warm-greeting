import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("newsletter_signups")
      .insert({ email: email.trim().toLowerCase() });
    setSubmitting(false);
    if (error && !/duplicate|unique/i.test(error.message)) {
      toast.error("Couldn't sign you up. Try again.");
      return;
    }
    setDone(true);
    toast.success("You're on the list. Watch your inbox.");
  };

  return (
    <section className="relative py-24 md:py-32 border-t border-border overflow-hidden grain">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none">
        <div className="display-h text-[30vw] leading-none text-foreground whitespace-nowrap -translate-x-[10%] translate-y-[5%]">
          NICKY BOY
        </div>
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 md:px-10 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="kicker mb-6"
        >
          <span className="text-ember">◆</span> Drop 002 loading
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.05 }}
          className="display-h text-5xl md:text-7xl lg:text-8xl leading-[0.86] mb-6"
        >
          Get early<br/><span className="text-ember">access.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10"
        >
          One email per drop. Never a discount code, never a sale.
          Just first shot at pieces before they're public.
        </motion.p>

        {!done ? (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.25 }}
            onSubmit={submit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somewhere.com"
              className="flex-1 h-14 px-5 bg-transparent border border-border focus:border-ember outline-none font-mono text-sm"
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-14 px-6 bg-foreground text-background font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-ember hover:text-ink transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? "Signing up…" : (<>Notify me <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} /></>)}
            </button>
          </motion.form>
        ) : (
          <p className="hand text-3xl md:text-4xl text-ember">You're in. — NB</p>
        )}
      </div>
    </section>
  );
}
