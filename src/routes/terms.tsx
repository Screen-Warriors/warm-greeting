import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout } from "@/components/nickyboy/legal-layout";
import { BUSINESS, LAST_UPDATED } from "@/lib/legal";

const TOC = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "eligibility", label: "Eligibility" },
  { id: "products", label: "Products" },
  { id: "pricing", label: "Pricing, Taxes & Discounts" },
  { id: "orders", label: "Order Acceptance & Cancellation" },
  { id: "payments", label: "Payments & Razorpay" },
  { id: "shipping", label: "Shipping" },
  { id: "returns", label: "Returns & Refunds" },
  { id: "ip", label: "Intellectual Property" },
  { id: "conduct", label: "User Conduct & Fraud" },
  { id: "termination", label: "Account Termination" },
  { id: "liability", label: "Limitation of Liability" },
  { id: "warranty", label: "Warranty Disclaimer" },
  { id: "force-majeure", label: "Force Majeure" },
  { id: "indemnity", label: "Indemnification" },
  { id: "third-party", label: "Third-Party Links" },
  { id: "changes", label: "Changes to Terms" },
  { id: "law", label: "Governing Law & Jurisdiction" },
  { id: "disputes", label: "Dispute Resolution" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — NICKY BOY" },
      { name: "description", content: "The terms that govern purchases from NICKY BOY: eligibility, pricing, payments through Razorpay, shipping, returns, liability, and governing law." },
      { property: "og:title", content: "Terms & Conditions — NICKY BOY" },
      { property: "og:description", content: "Terms governing NICKY BOY purchases, payments, and returns." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/terms" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Terms & Conditions", item: "/terms" },
        ],
      }),
    }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Legal / 001"
      title="Terms & Conditions"
      intro={`These terms govern your use of the ${BUSINESS.name} website and any purchase you make from us. By placing an order, you agree to them.`}
      toc={TOC}
      lastUpdated={LAST_UPDATED}
    >
      <Section id="acceptance" title="1. Acceptance of Terms">
        <p>
          By accessing this website, creating an account, or placing an order, you confirm that you have read, understood, and agree to be bound by these Terms & Conditions and our <Link to="/privacy" className="underline decoration-ember underline-offset-4">Privacy Policy</Link>. If you do not agree, please discontinue use of the site.
        </p>
      </Section>

      <Section id="eligibility" title="2. Eligibility">
        <p>You must be at least 18 years of age, or accessing the site under the supervision of a parent or legal guardian, and capable of entering into a legally binding contract under Indian law.</p>
      </Section>

      <Section id="products" title="3. Products">
        <p>All garments are produced in small, limited runs. Colours, textures, and prints may vary slightly due to hand-finishing, dye lots, and screen calibration. Product images are indicative and not a warranty of exact appearance.</p>
      </Section>

      <Section id="pricing" title="4. Pricing, Taxes & Discounts">
        <p>All prices are displayed in Indian Rupees (₹ INR) and are inclusive of applicable GST unless stated otherwise. We reserve the right to correct pricing errors and to modify prices without prior notice.</p>
        <SubHeading>Discounts</SubHeading>
        <p>Discount codes, where offered, are single-use, non-transferable, and cannot be combined unless expressly stated.</p>
      </Section>

      <Section id="orders" title="5. Order Acceptance & Cancellation">
        <p>An order confirmation email is an acknowledgement of receipt, not an acceptance. {BUSINESS.name} reserves the right, at its sole discretion, to refuse or cancel any order — including for reasons of stock, suspected fraud, address issues, or pricing errors. If we cancel a paid order, the full amount will be refunded to the original payment method.</p>
        <SubHeading>Customer cancellation</SubHeading>
        <p>You may request cancellation before the order is dispatched by writing to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a>. Once dispatched, cancellation is not possible; the return process applies.</p>
      </Section>

      <Section id="payments" title="6. Payments & Razorpay">
        <p>Online prepaid payments are securely processed by <strong>Razorpay</strong>, a PCI-DSS compliant payment gateway. Cash on Delivery (COD) is available for eligible orders with an additional handling fee shown at checkout.</p>
        <Callout>
          {BUSINESS.name} does not receive, store, or process any card numbers, CVV, UPI PINs, or netbanking credentials. All sensitive payment data is handled directly by Razorpay under its own terms and privacy policy.
        </Callout>
      </Section>

      <Section id="shipping" title="7. Shipping">
        <p>Orders ship within 48 hours of confirmation, PAN-India, for a flat fee of ₹99. Please refer to our <Link to="/shipping" className="underline decoration-ember underline-offset-4">Shipping Policy</Link> for delivery windows and courier details.</p>
      </Section>

      <Section id="returns" title="8. Returns & Refunds">
        <p>Eligible items may be returned within 7 days of delivery in original, unused condition with tags attached. See our <Link to="/returns" className="underline decoration-ember underline-offset-4">Returns & Refund Policy</Link> for the full process.</p>
      </Section>

      <Section id="ip" title="9. Intellectual Property">
        <p>All content on this site — including the {BUSINESS.name} name, wordmark, logos, garment prints, illustrations, photography, copy, and code — is owned by or licensed to {BUSINESS.legalName} and is protected by copyright and trademark laws.</p>
        <p>You may not reproduce, distribute, resell, or create derivative works from any material on this site without prior written consent.</p>
      </Section>

      <Section id="conduct" title="10. User Conduct & Fraud Prevention">
        <p>You agree not to use the site to place fraudulent orders, misuse promotions, submit false information, attempt to breach security, or interfere with other users. We may flag, cancel, or refuse service on any order we reasonably suspect of fraud, and may share information with payment providers and law enforcement where lawful.</p>
      </Section>

      <Section id="termination" title="11. Account Termination">
        <p>We may suspend or terminate access at any time for breach of these terms, suspected fraud, or misuse of the service. Termination does not affect any rights or obligations that accrued prior.</p>
      </Section>

      <Section id="liability" title="12. Limitation of Liability">
        <p>To the maximum extent permitted by law, {BUSINESS.legalName}, its directors, employees, and partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, goodwill, or business, arising out of your use of the site or products. Our total aggregate liability for any claim relating to a product is limited to the amount you paid for that product.</p>
      </Section>

      <Section id="warranty" title="13. Warranty Disclaimer">
        <p>The site and products are provided on an "as is" and "as available" basis without warranties of any kind, express or implied, except those that cannot be excluded under applicable law.</p>
      </Section>

      <Section id="force-majeure" title="14. Force Majeure">
        <p>We are not liable for delays or failures caused by events beyond our reasonable control, including natural disasters, strikes, courier disruptions, acts of government, pandemic-related restrictions, or infrastructure failures.</p>
      </Section>

      <Section id="indemnity" title="15. Indemnification">
        <p>You agree to indemnify and hold harmless {BUSINESS.legalName} against any claims, damages, or expenses arising from your breach of these terms or misuse of the site.</p>
      </Section>

      <Section id="third-party" title="16. Third-Party Links">
        <p>Our site may link to third-party services (payment gateway, analytics, social platforms). We are not responsible for the content or practices of those third parties.</p>
      </Section>

      <Section id="changes" title="17. Changes to Terms">
        <p>We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms. The "Last Updated" date at the foot of this page reflects the latest revision.</p>
      </Section>

      <Section id="law" title="18. Governing Law & Jurisdiction">
        <p>These terms are governed by the laws of India. Subject to the dispute resolution clause below, the courts at Bengaluru, Karnataka shall have exclusive jurisdiction.</p>
      </Section>

      <Section id="disputes" title="19. Dispute Resolution">
        <p>Any dispute shall first be attempted to be resolved amicably by written notice to us. Failing resolution within 30 days, the dispute may be referred to arbitration by a sole arbitrator in Bengaluru under the Arbitration and Conciliation Act, 1996. The language of arbitration shall be English.</p>
      </Section>

      <Section id="contact" title="20. Contact">
        <p>Questions about these terms? Write to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> or use our <Link to="/contact" className="underline decoration-ember underline-offset-4">Contact page</Link>.</p>
      </Section>
    </LegalLayout>
  );
}
