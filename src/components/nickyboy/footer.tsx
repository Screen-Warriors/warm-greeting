import { Instagram, Twitter, Youtube } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#050505] pt-16 pb-6">
      <div className="mx-auto max-w-[1600px] px-5 md:px-10">
        <div className="grid grid-cols-12 gap-8 mb-16">
          <div className="col-span-12 md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-10 border border-foreground grid place-items-center font-display text-lg">NB</span>
              <span className="font-display text-2xl">Nicky Boy</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              An independent streetwear label from Bengaluru. We drop one silhouette at a time,
              numbered and limited. No sales, no restocks — when it's gone, it's gone.
            </p>
            <div className="flex items-center gap-3 mt-6">
              {[Instagram, Twitter, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 grid place-items-center border border-border hover:border-ember hover:text-ember transition-colors">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div className="col-span-6 md:col-span-2">
            <p className="kicker mb-4">Shop</p>
            <ul className="space-y-3 text-sm">
              <li><a href="/#purchase" className="hover:text-ember transition-colors">Signature Crewneck</a></li>
              <li><a href="/#reviews" className="hover:text-ember transition-colors">Reviews</a></li>
              <li><a href="/#faq" className="hover:text-ember transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <p className="kicker mb-4">Help</p>
            <ul className="space-y-3 text-sm">
              <li><Link to="/track-order" className="hover:text-ember transition-colors">Track order</Link></li>
              <li><Link to="/shipping" className="hover:text-ember transition-colors">Shipping</Link></li>
              <li><Link to="/returns" className="hover:text-ember transition-colors">Returns & Refunds</Link></li>
              <li><Link to="/contact" className="hover:text-ember transition-colors">Contact us</Link></li>
              <li><Link to="/terms" className="hover:text-ember transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-ember transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div className="col-span-12 md:col-span-3">
            <p className="kicker mb-4">Studio</p>
            <address className="not-italic text-sm text-muted-foreground leading-relaxed">
              NICKY BOY / Studio 3F<br/>
              Indiranagar, Bengaluru<br/>
              India — 560038<br/>
              <a href="mailto:hello@moneywithgenz.in" className="text-foreground hover:text-ember transition-colors mt-2 inline-block">hello@moneywithgenz.in</a>
            </address>
          </div>
        </div>

        {/* Huge wordmark */}
        <div className="border-t border-border pt-10 mb-10 overflow-hidden">
          <p className="display-h text-[22vw] leading-[0.85] text-foreground/95 -tracking-[0.03em] select-none">
            NICKY BOY.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-border">
          <div className="flex items-center gap-5 text-[11px] font-mono text-muted-foreground">
            <span>© {new Date().getFullYear()} NICKY BOY LABEL PVT. LTD.</span>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            <span>Pay with</span>
            <span className="px-2 py-1 border border-border">UPI</span>
            <span className="px-2 py-1 border border-border">Cards</span>
            <span className="px-2 py-1 border border-border">Netbanking</span>
            <span className="px-2 py-1 border border-border">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
