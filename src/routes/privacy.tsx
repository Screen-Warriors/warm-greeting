import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout } from "@/components/nickyboy/legal-layout";
import { BUSINESS, LAST_UPDATED } from "@/lib/legal";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "collected", label: "Information We Collect" },
  { id: "usage", label: "How We Use Information" },
  { id: "storage", label: "Database & Security" },
  { id: "payments", label: "Payment Processing" },
  { id: "cookies", label: "Cookies & Analytics" },
  { id: "rights", label: "Your Rights" },
  { id: "third-parties", label: "Third-Party Services" },
  { id: "retention", label: "Data Retention" },
  { id: "children", label: "Children's Privacy" },
  { id: "updates", label: "Policy Updates" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — NICKY BOY" },
      { name: "description", content: "How NICKY BOY collects, uses, and protects your personal information — including secure payment processing through Razorpay." },
      { property: "og:title", content: "Privacy Policy — NICKY BOY" },
      { property: "og:description", content: "How NICKY BOY protects your personal information." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/privacy" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Privacy Policy", item: "/privacy" },
        ],
      }),
    }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Legal / 002"
      title="Privacy Policy"
      intro={`${BUSINESS.name} is committed to protecting your personal information. This policy explains what we collect, why, how it's stored, and the choices you have.`}
      toc={TOC}
      lastUpdated={LAST_UPDATED}
    >
      <Section id="overview" title="1. Overview">
        <p>{BUSINESS.legalName} ("we", "us") operates this website and the {BUSINESS.name} label. We handle personal information in accordance with applicable Indian data-protection laws, including the Digital Personal Data Protection Act, 2023.</p>
      </Section>

      <Section id="collected" title="2. Information We Collect">
        <SubHeading>Provided by you</SubHeading>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Full name, shipping address, city, state, PIN code, country</li>
          <li>Phone number (with country code)</li>
          <li>Email address</li>
          <li>Order history and preferences (sizes, colours)</li>
          <li>Messages sent via our contact form</li>
          <li>Marketing consent (newsletter opt-in)</li>
        </ul>
        <SubHeading>Collected automatically</SubHeading>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Device and browser information, approximate location (IP-based)</li>
          <li>Cookies and similar technologies</li>
          <li>Site usage analytics — pages viewed, referrers, session duration</li>
        </ul>
      </Section>

      <Section id="usage" title="3. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To process orders, arrange shipping, and provide customer support</li>
          <li>To send transactional messages (order confirmation, dispatch, delivery, refunds)</li>
          <li>To send marketing emails, only where you have opted in</li>
          <li>For fraud detection and platform security</li>
          <li>To improve our products, site experience, and inventory planning</li>
          <li>To meet legal, tax, and accounting obligations</li>
        </ul>
      </Section>

      <Section id="storage" title="4. Database & Security">
        <p>Customer records — orders, contact messages, newsletter signups — are stored securely in <strong>Supabase</strong>, a managed PostgreSQL platform with encryption at rest and in transit. Access is restricted through role-based permissions and row-level security policies.</p>
        <p>Despite reasonable safeguards, no online system is completely secure. You share information at your own risk.</p>
      </Section>

      <Section id="payments" title="5. Payment Processing">
        <Callout tone="warn">
          Payments are securely processed by <strong>Razorpay</strong>. {BUSINESS.name} never sees, stores, or has access to your card numbers, CVV, UPI PIN, or netbanking credentials. Razorpay is PCI-DSS Level 1 compliant and applies its own privacy terms to payment data.
        </Callout>
      </Section>

      <Section id="cookies" title="6. Cookies & Analytics">
        <p>We use a small number of cookies for essential site functionality (cart, session) and, where enabled, analytics to understand aggregate usage. You may block or delete cookies via your browser settings; some site features may not work as intended.</p>
      </Section>

      <Section id="rights" title="7. Your Rights">
        <p>You may, subject to applicable law, request to:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Access the personal information we hold about you</li>
          <li>Correct inaccurate or outdated information</li>
          <li>Delete your account and associated data</li>
          <li>Receive a portable copy of your data</li>
          <li>Opt out of marketing communications at any time</li>
        </ul>
        <p>To exercise any of these rights, email <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a>. We may need to verify your identity before actioning a request.</p>
      </Section>

      <Section id="third-parties" title="8. Third-Party Services">
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Supabase</strong> — database and authentication</li>
          <li><strong>Razorpay</strong> — payment processing</li>
          <li>Courier partners — fulfilment and delivery</li>
          <li>Email delivery providers — transactional and newsletter emails</li>
          <li>Analytics providers — aggregate usage measurement</li>
        </ul>
        <p>Each third-party processes data under its own privacy terms.</p>
      </Section>

      <Section id="retention" title="9. Data Retention">
        <p>Order and invoice records are retained for the period required under Indian tax and accounting laws. Marketing preferences are retained until you unsubscribe. Contact messages are retained for up to 24 months.</p>
      </Section>

      <Section id="children" title="10. Children's Privacy">
        <p>The site is not intended for children under 18. We do not knowingly collect personal information from minors without parental consent.</p>
      </Section>

      <Section id="updates" title="11. Policy Updates">
        <p>We may update this policy periodically. Material changes will be highlighted on this page and, where appropriate, notified by email.</p>
      </Section>

      <Section id="contact" title="12. Contact">
        <p>Privacy questions? Write to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> or use our <Link to="/contact" className="underline decoration-ember underline-offset-4">Contact page</Link>.</p>
      </Section>
    </LegalLayout>
  );
}
