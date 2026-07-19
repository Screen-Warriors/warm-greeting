import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Nav } from "./nav";
import { Footer } from "./footer";
import { List, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type TocItem = { id: string; label: string };

export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none" aria-hidden>
      <div
        className="h-full bg-ember transition-[width] duration-100 ease-out"
        style={{ width: `${p * 100}%` }}
      />
    </div>
  );
}

function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if (!ids.length) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 1] },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join("|")]);
  return active;
}

function TocList({ toc, active, onNav }: { toc: TocItem[]; active: string; onNav?: () => void }) {
  return (
    <ol className="space-y-1.5 font-mono text-[11px] tracking-[0.14em] uppercase">
      {toc.map((t, i) => (
        <li key={t.id}>
          <a
            href={`#${t.id}`}
            onClick={onNav}
            className={cn(
              "flex gap-3 py-1.5 border-l-2 pl-3 transition-colors",
              active === t.id
                ? "border-ember text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            <span className="tabular-nums opacity-50">{String(i + 1).padStart(2, "0")}</span>
            <span className="normal-case tracking-normal font-sans text-xs leading-snug">{t.label}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export function LegalLayout({
  eyebrow,
  title,
  intro,
  toc,
  children,
  lastUpdated,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  toc?: TocItem[];
  children: ReactNode;
  lastUpdated?: string;
}) {
  const ids = useMemo(() => (toc ?? []).map((t) => t.id), [toc]);
  const active = useActiveHeading(ids);
  const [mobileOpen, setMobileOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ReadingProgress />
      <Nav />

      <div className="h-16 md:h-20" />

      <section className="border-b border-border">
        <div className="mx-auto max-w-[1200px] px-5 md:px-10 pt-14 pb-10 md:pt-20 md:pb-14">
          <p className="kicker mb-5 text-ember">{eyebrow}</p>
          <h1 className="display-h text-4xl md:text-6xl lg:text-7xl leading-[0.95] max-w-4xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {intro}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-5 md:px-10 py-12 md:py-16">
        <div className="grid grid-cols-12 gap-8 md:gap-14">
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block col-span-3">
              <div className="sticky top-28">
                <p className="kicker mb-5">Contents</p>
                <TocList toc={toc} active={active} />
              </div>
            </aside>
          )}

          <article
            ref={contentRef}
            className={cn(
              "col-span-12",
              toc && toc.length > 0 ? "lg:col-span-9" : "",
            )}
          >
            <div className="prose-legal max-w-[760px]">
              {children}

              {lastUpdated && (
                <div className="mt-16 pt-8 border-t border-border">
                  <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                    Last Updated: {lastUpdated}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground italic max-w-lg">
                    This document is provided for general information. It is not legal advice. Please consult a qualified legal professional before relying on it.
                  </p>
                </div>
              )}
            </div>
          </article>
        </div>
      </div>

      {toc && toc.length > 0 && (
        <>
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-foreground text-background font-mono text-[11px] tracking-[0.2em] uppercase shadow-lg rounded-full"
            aria-label="Open contents"
          >
            <List className="w-4 h-4" strokeWidth={1.75} /> Contents
          </button>
          {mobileOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-xl" role="dialog" aria-modal="true">
              <div className="p-5 flex items-center justify-between border-b border-border">
                <p className="kicker">Contents</p>
                <button onClick={() => setMobileOpen(false)} aria-label="Close" className="p-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto max-h-[calc(100dvh-60px)]">
                <TocList toc={toc} active={active} onNav={() => setMobileOpen(false)} />
              </div>
            </div>
          )}
        </>
      )}

      <Footer />
    </main>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mt-12 first:mt-0">
      <h2 className="font-display text-2xl md:text-3xl tracking-tight text-foreground mb-4">
        {title}
      </h2>
      <div className="space-y-4 text-[15px] md:text-base leading-[1.8] text-foreground/85">
        {children}
      </div>
    </section>
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h3 className="font-display text-lg md:text-xl mt-6 mb-2 text-foreground">{children}</h3>;
}

export function Callout({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={cn(
        "my-6 border-l-2 pl-5 py-3 pr-4 text-sm bg-foreground/[0.03]",
        tone === "warn" ? "border-ember" : "border-foreground/40",
      )}
    >
      {children}
    </div>
  );
}
