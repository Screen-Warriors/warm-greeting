import { motion } from "framer-motion";
import { useState } from "react";
import { Star, PenLine } from "lucide-react";
import { REVIEWS } from "@/lib/product";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

function Stars({ n, size = "sm" }: { n: number; size?: "sm" | "lg" }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${n} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i}
          className={cn(size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5", i < n ? "fill-ember text-ember" : "text-foreground/20")}
          strokeWidth={1.4}
        />
      ))}
    </div>
  );
}

function WriteReview() {
  const [rating, setRating] = useState(5);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const comment = String(form.get("comment") ?? "").trim();
    if (!name || !comment) { toast.error("Add your name and review."); return; }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: PRODUCT.id,
      reviewer_name: name,
      city: String(form.get("city") ?? "").trim() || null,
      rating,
      title: String(form.get("title") ?? "").trim() || null,
      comment,
      is_approved: false,
    });
    setSubmitting(false);
    if (error) { toast.error("Couldn't submit. Try again."); return; }
    setOpen(false);
    toast.success("Thanks — your review is queued for moderation.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 border border-foreground/30 hover:border-foreground px-5 py-3 font-mono text-[11px] tracking-[0.28em] uppercase transition-colors">
          <PenLine className="w-3.5 h-3.5" strokeWidth={1.5} /> Write a review
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="display-h text-3xl">Leave a review</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="kicker block mb-2">Your rating</label>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star className={cn("w-8 h-8 transition-transform hover:scale-110",
                    n <= rating ? "fill-ember text-ember" : "text-foreground/20")} strokeWidth={1.2} />
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="name" placeholder="Your name" className="h-11 px-3 bg-background border border-border focus:border-ember outline-none font-mono text-sm" />
            <input name="city" placeholder="City (optional)" className="h-11 px-3 bg-background border border-border focus:border-ember outline-none font-mono text-sm" />
          </div>
          <input name="title" placeholder="Headline" className="w-full h-11 px-3 bg-background border border-border focus:border-ember outline-none font-mono text-sm" />
          <textarea name="comment" placeholder="Tell us how it fits, feels, holds up…" rows={4}
            className="w-full p-3 bg-background border border-border focus:border-ember outline-none text-sm leading-relaxed resize-none" />
          <button disabled={submitting} className="w-full h-12 bg-foreground text-background font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-ember hover:text-ink transition-colors disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit review"}
          </button>
          <p className="text-[10px] text-muted-foreground">Reviews are moderated before publishing. Please keep it real.</p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Reviews() {
  const avg = REVIEWS.reduce((a, r) => a + r.rating, 0) / REVIEWS.length;

  return (
    <section id="reviews" className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-6 mb-12 items-end">
          <div className="col-span-12 md:col-span-7">
            <p className="kicker mb-3"><span className="text-ember">◆</span> Chapter 04 / What people say</p>
            <h2 className="display-h text-5xl md:text-7xl leading-[0.86]">
              <span className="text-ember">{avg.toFixed(1)}</span> / 5<br/>
              <span className="text-foreground/60">from {REVIEWS.length * 47} humans.</span>
            </h2>
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-col md:items-end gap-4">
            <Stars n={Math.round(avg)} size="lg" />
            <WriteReview />
          </div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="flex gap-4 md:gap-5 overflow-x-auto pb-4 -mx-5 md:-mx-10 px-5 md:px-10 snap-x snap-mandatory"
        >
          {REVIEWS.map((r) => (
            <motion.article
              key={r.id}
              variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.8 } } }}
              className="min-w-[320px] md:min-w-[400px] max-w-[400px] border border-border bg-card/40 p-6 md:p-7 snap-start flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <Stars n={r.rating} />
                <span className="kicker text-muted-foreground">{r.date}</span>
              </div>
              <h3 className="font-display text-xl leading-tight">{r.title}</h3>
              <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{r.body}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <div className="w-9 h-9 grid place-items-center bg-ember/10 border border-ember/40 font-display text-sm text-ember">
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-mono text-xs">{r.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                    {r.city}
                    {r.verified && <span className="text-ember">◆ Verified</span>}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
