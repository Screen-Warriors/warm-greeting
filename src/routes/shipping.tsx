import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout } from "@/components/nickyboy/legal-layout";
import { BUSINESS, LAST_UPDATED } from "@/lib/legal";

const TOC = [
  { id: "processing", label: "Processing Time" },
  { id: "coverage", label: "Delivery Coverage" },
  { id: "estimates", label: "Delivery Estimates" },
  { id: "fee", label: "Shipping Fee" },
  { id: "tracking", label: "Tracking" },
  { id: "delays", label: "Delivery Delays" },
  { id: "failed", label: "Failed Deliveries" },
  { id: "address", label: "Incorrect Addresses" },
  { id: "lost", label: "Lost Packages" },
  { id: "damaged", label: "Damaged Shipments" },
  { id: "responsibilities", label: "Customer Responsibilities" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — NICKY BOY" },
      { name: "description", content: "PAN-India shipping, ₹99 flat rate, dispatch within 48 hours. Delivery windows, tracking, and support." },
      { property: "og:title", content: "Shipping Policy — NICKY BOY" },
      { property: "og:description", content: "PAN-India shipping, flat ₹99, dispatched within 48 hours." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/shipping" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/shipping" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Shipping Policy", item: "/shipping" },
        ],
      }),
    }],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <LegalLayout
      eyebrow="Support / Shipping"
      title="Shipping Policy"
      intro={`${BUSINESS.name} ships pan-India from Bengaluru. Every order is packed by hand and dispatched within 48 hours of confirmation.`}
      toc={TOC}
      lastUpdated={LAST_UPDATED}
    >
      <Section id="processing" title="1. Processing Time">
        <p>Orders are processed and dispatched within <strong>48 hours</strong> of successful payment (excluding Sundays and national holidays). During limited drops or restocks, processing may extend to 72 hours; we will notify you if so.</p>
      </Section>

      <Section id="coverage" title="2. Delivery Coverage">
        <p>We ship to all serviceable pincodes across India. International shipping is not available at this time.</p>
      </Section>

      <Section id="estimates" title="3. Delivery Estimates">
        <div className="my-2 overflow-x-auto rounded border border-border">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Region</th>
                <th className="text-left px-4 py-3 font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Estimated delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr><td className="px-4 py-3">Metro cities</td><td className="px-4 py-3">2 – 4 business days</td></tr>
              <tr><td className="px-4 py-3">Tier 2 cities</td><td className="px-4 py-3">4 – 6 business days</td></tr>
              <tr><td className="px-4 py-3">Tier 3 cities & towns</td><td className="px-4 py-3">5 – 8 business days</td></tr>
              <tr><td className="px-4 py-3">Remote areas</td><td className="px-4 py-3">7 – 12 business days</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">Estimates are indicative and start from the date of dispatch, not the date of order.</p>
      </Section>

      <Section id="fee" title="4. Shipping Fee">
        <p>Flat <strong>₹99</strong> per order, pan-India. Cash on Delivery orders carry an additional handling fee shown at checkout.</p>
      </Section>

      <Section id="tracking" title="5. Tracking">
        <p>Once dispatched, you will receive an email with:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Your tracking number</li>
          <li>The courier partner assigned</li>
          <li>A direct link to the courier's tracking page</li>
        </ul>
        <Callout>Please allow up to 24 hours after dispatch for the tracking status to update on the courier's system.</Callout>
      </Section>

      <Section id="delays" title="6. Delivery Delays">
        <p>Weather, strikes, courier hub disruptions, and other events outside our control can cause delays. We will keep you informed by email where possible and support you in escalating with the courier.</p>
      </Section>

      <Section id="failed" title="7. Failed Deliveries">
        <p>Couriers typically make up to three delivery attempts. If all attempts fail — for example, no one available at the address or the recipient is unreachable — the package will be returned to us. Re-shipping fees may apply.</p>
      </Section>

      <Section id="address" title="8. Incorrect Addresses">
        <p>Please double-check your shipping address at checkout. We are unable to redirect a package once dispatched. If the address is incorrect and the package is returned, we can re-ship after collecting an additional shipping fee.</p>
      </Section>

      <Section id="lost" title="9. Lost Packages">
        <p>If tracking has not updated for 7 consecutive business days, contact us and we will open a formal investigation with the courier. Investigations typically resolve within 7 – 14 business days. Confirmed lost packages will be re-shipped or refunded in full.</p>
      </Section>

      <Section id="damaged" title="10. Damaged Shipments">
        <p>If the outer packaging is visibly damaged at delivery, please refuse the parcel or record an unboxing video. Report damage within 48 hours to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> with photos/video. See our <Link to="/returns" className="underline decoration-ember underline-offset-4">Returns Policy</Link> for the full process.</p>
      </Section>

      <Section id="responsibilities" title="11. Customer Responsibilities">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Provide a complete, accurate shipping address with a reachable phone number.</li>
          <li>Be available or nominate someone to receive the parcel.</li>
          <li>Inspect the parcel at delivery and record video for high-value orders.</li>
          <li>Contact us promptly if issues arise.</li>
        </ul>
      </Section>

      <Section id="contact" title="12. Contact">
        <p>Shipping questions? Write to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> or reach us through the <Link to="/contact" className="underline decoration-ember underline-offset-4">Contact page</Link>.</p>
      </Section>
    </LegalLayout>
  );
}
