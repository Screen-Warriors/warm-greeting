import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nickyboy/nav";
import { Hero } from "@/components/nickyboy/hero";
import { MarqueeBar } from "@/components/nickyboy/story";
import { Story } from "@/components/nickyboy/story";
import { Gallery } from "@/components/nickyboy/gallery";
import { PurchasePanel } from "@/components/nickyboy/purchase";
import { Features } from "@/components/nickyboy/features";
import { Reviews } from "@/components/nickyboy/reviews";
import { Lookbook } from "@/components/nickyboy/lookbook";
import { FaqSection } from "@/components/nickyboy/faq";
import { Newsletter } from "@/components/nickyboy/newsletter";
import { Footer } from "@/components/nickyboy/footer";
import { CartDrawer } from "@/components/nickyboy/cart-drawer";
import { TrustBar } from "@/components/nickyboy/trust-bar";
import { StickyMobileCTA } from "@/components/nickyboy/sticky-mobile-cta";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TrustBar />
      <PurchasePanel />
      <Reviews />
      <Story />
      <Gallery />
      <Features />
      <Lookbook />
      <FaqSection />
      <Newsletter />
      <Footer />
      <CartDrawer />
      <StickyMobileCTA />
      <MarqueeBar />
    </main>
  );
}

