import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Nav } from "@/components/nickyboy/nav";
import { Footer } from "@/components/nickyboy/footer";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS } from "@/lib/legal";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — NICKY BOY" },
      { name: "description", content: "Reach the NICKY BOY studio in Bengaluru — questions, orders, press. We reply within one business day." },
      { property: "og:title", content: "Contact — NICKY BOY" },
      { property: "og:description", content: "Reach the NICKY BOY studio in Bengaluru." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/contact" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: "Contact NICKY BOY",
        url: "/contact",
        publisher: {
          "@type": "Organization",
          name: BUSINESS.legalName,
          email: BUSINESS.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: BUSINESS.addressLine1,
            addressLocality: "Bengaluru",
            addressRegion: "Karnataka",
            postalCode: "560038",
            addressCountry: "IN",
          },
          contactPoint: [{
            "@type": "ContactPoint",
            email: BUSINESS.email,
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
          }],
        },
      }),
    }],
  }),
  component: ContactPage,
});

const SUBJECTS = ["Order support", "Shipping & tracking", "Returns & refunds", "Product question", "Press / collab", "Other"];

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Choose a subject").max(120),
  message: z.string().trim().min(10, "Message is too short").max(2000),
  website: z.string().max(0, "Bot detected").optional().or(z.literal("")), // honeypot
});

type FormValues = z.infer<typeof schema>;

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", subject: SUBJECTS[0], message: "", website: "" },
  });

  const onSubmit = async (values: FormValues) => {
    // Basic bot check — submitted absurdly fast
    if (Date.now() - startedAt < 1500) {
      toast.error("Please take a moment before submitting.");
      return;
    }
    // Rate-limit per browser: 60s cooldown
    try {
      const last = Number(localStorage.getItem("nb_contact_ts") || 0);
      if (Date.now() - last < 60_000) {
        toast.error("You just sent a message. Please wait a minute before sending another.");
        return;
      }
    } catch { /* ignore */ }

    const { error } = await supabase.from("contact_submissions").insert({
      name: values.name,
      email: values.email.toLowerCase(),
      phone: values.phone || null,
      subject: values.subject,
      message: values.message,
    });

    if (error) {
      console.error(error);
      toast.error("Couldn't send your message. Please try again or email us directly.");
      return;
    }

    try { localStorage.setItem("nb_contact_ts", String(Date.now())); } catch { /* ignore */ }
    toast.success("Message received. We'll reply within one business day.");
    setSubmitted(true);
    reset();
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="h-16 md:h-20" />

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10 pt-14 pb-10 md:pt-20 md:pb-14">
          <p className="kicker mb-5 text-ember">Support / Contact</p>
          <h1 className="display-h text-4xl md:text-6xl lg:text-7xl leading-[0.95] max-w-4xl">
            Talk to the studio.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Questions about an order, sizing, or a collab? Reach us directly — a human replies within one business day.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-12 gap-10 md:gap-14">
          {/* Info column */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <InfoBlock icon={<Mail className="w-4 h-4" />} label="Email">
              <a href={`mailto:${BUSINESS.email}`} className="hover:text-ember transition-colors">{BUSINESS.email}</a>
            </InfoBlock>
            <InfoBlock icon={<MapPin className="w-4 h-4" />} label="Studio">
              <address className="not-italic text-sm text-foreground/80 leading-relaxed">
                {BUSINESS.legalName}<br/>
                {BUSINESS.addressLine1}<br/>
                {BUSINESS.addressLine2}<br/>
                {BUSINESS.addressLine3}
              </address>
            </InfoBlock>
            <InfoBlock icon={<Clock className="w-4 h-4" />} label="Hours">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Monday — Saturday<br/>
                11:00 AM — 7:00 PM IST<br/>
                Closed on Sundays and public holidays.
              </p>
            </InfoBlock>

            <div className="pt-2 border-t border-border">
              <p className="kicker mb-3">Quick help</p>
              <ul className="text-sm space-y-2">
                <li><Link to="/shipping" className="hover:text-ember transition-colors">Shipping & tracking</Link></li>
                <li><Link to="/returns" className="hover:text-ember transition-colors">Returns & refunds</Link></li>
                <li><Link to="/terms" className="hover:text-ember transition-colors">Terms & conditions</Link></li>
                <li><Link to="/privacy" className="hover:text-ember transition-colors">Privacy policy</Link></li>
              </ul>
            </div>
          </aside>

          {/* Form column */}
          <div className="col-span-12 lg:col-span-8">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="border border-border bg-foreground/[0.02] p-8 md:p-10"
              >
                <p className="kicker text-ember mb-3">Received</p>
                <h2 className="font-display text-3xl md:text-4xl mb-4">Message on the way.</h2>
                <p className="text-muted-foreground max-w-md leading-relaxed">
                  We've logged your note and will reply within one business day. Meanwhile, feel free to keep browsing the drop.
                </p>
                <div className="mt-8 flex gap-3">
                  <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-ember hover:text-ink transition-colors">
                    Back to store <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </Link>
                  <button onClick={() => setSubmitted(false)} className="px-5 py-3 border border-border font-mono text-[11px] tracking-[0.28em] uppercase text-muted-foreground hover:text-foreground transition-colors">
                    Send another
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                {/* Honeypot */}
                <div aria-hidden className="hidden">
                  <label>Website<input type="text" tabIndex={-1} autoComplete="off" {...register("website")} /></label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full name" error={errors.name?.message} htmlFor="c-name">
                    <input id="c-name" autoComplete="name" {...register("name")} className={inputClass(!!errors.name)} />
                  </Field>
                  <Field label="Email" error={errors.email?.message} htmlFor="c-email">
                    <input id="c-email" type="email" autoComplete="email" {...register("email")} className={inputClass(!!errors.email)} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Phone (optional)" error={errors.phone?.message} htmlFor="c-phone">
                    <input id="c-phone" type="tel" autoComplete="tel" {...register("phone")} className={inputClass(!!errors.phone)} />
                  </Field>
                  <Field label="Subject" error={errors.subject?.message} htmlFor="c-subject">
                    <select id="c-subject" {...register("subject")} className={cn(inputClass(!!errors.subject), "appearance-none pr-8")}>
                      {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Message" error={errors.message?.message} htmlFor="c-message">
                  <textarea id="c-message" rows={6} {...register("message")} className={cn(inputClass(!!errors.message), "min-h-[140px] py-3 resize-y leading-relaxed")} />
                </Field>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 h-12 px-6 bg-foreground text-background font-mono text-[11px] tracking-[0.28em] uppercase hover:bg-ember hover:text-ink transition-colors disabled:opacity-60"
                  >
                    {isSubmitting ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>) : (<>Send message <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} /></>)}
                  </button>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    By sending, you agree to our <Link to="/privacy" className="underline decoration-ember underline-offset-4">Privacy Policy</Link>.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function InfoBlock({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        <span className="w-8 h-8 grid place-items-center border border-border">{icon}</span>
        <span className="kicker">{label}</span>
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

function Field({ label, error, htmlFor, children }: { label: string; error?: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block mb-1.5 font-mono text-[10px] tracking-[0.28em] uppercase text-muted-foreground">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-ember">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full h-11 px-3 bg-transparent border outline-none text-sm font-mono transition-colors",
    hasError ? "border-ember" : "border-border focus:border-foreground",
  );
}
