import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalLayout, Section, SubHeading, Callout } from "@/components/nickyboy/legal-layout";
import { BUSINESS, LAST_UPDATED } from "@/lib/legal";

const TOC = [
  { id: "window", label: "7-Day Return Window" },
  { id: "eligibility", label: "Eligibility" },
  { id: "inspection", label: "Inspection Process" },
  { id: "refund-timeline", label: "Refund Timeline" },
  { id: "refund-method", label: "Refund Method" },
  { id: "cancel-before", label: "Cancellation Before Shipping" },
  { id: "cancel-after", label: "Cancellation After Shipping" },
  { id: "exchange", label: "Exchange Process" },
  { id: "non-returnable", label: "Non-returnable Items" },
  { id: "damaged", label: "Damaged Products" },
  { id: "return-shipping", label: "Return Shipping" },
  { id: "contact", label: "Contact" },
];

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Refund Policy — NICKY BOY" },
      { name: "description", content: "A 7-day return window, refund timeline, exchanges, and how to raise a return with NICKY BOY." },
      { property: "og:title", content: "Returns & Refund Policy — NICKY BOY" },
      { property: "og:description", content: "7-day returns, refund timeline, and exchange process." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/returns" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/returns" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          { "@type": "ListItem", position: 2, name: "Returns & Refund Policy", item: "/returns" },
        ],
      }),
    }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <LegalLayout
      eyebrow="Support / Returns"
      title="Returns & Refund Policy"
      intro={`If a piece doesn't work, you have 7 days from delivery to raise a return. Here's how it works.`}
      toc={TOC}
      lastUpdated={LAST_UPDATED}
    >
      <Section id="window" title="1. 7-Day Return Window">
        <p>Returns must be initiated within <strong>7 calendar days</strong> from the date of delivery, by emailing <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> with your order number and reason.</p>
      </Section>

      <Section id="eligibility" title="2. Eligibility">
        <p>To be accepted, an item must arrive at our studio:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>In original, unused, unwashed, un-altered condition</li>
          <li>With all original tags attached</li>
          <li>In the original packaging where possible</li>
          <li>Free of stains, odours, pet hair, or signs of wear</li>
        </ul>
      </Section>

      <Section id="inspection" title="3. Inspection Process">
        <p>Once your return is received, our team inspects it within 3 business days. If the item meets the eligibility criteria, we approve the refund or exchange. If it does not, we will notify you and ship it back to you.</p>
      </Section>

      <Section id="refund-timeline" title="4. Refund Timeline">
        <p>After approval, refunds are processed within <strong>3 – 5 business days</strong>. Your bank or card provider may take an additional 5 – 7 business days to reflect the credit.</p>
      </Section>

      <Section id="refund-method" title="5. Refund Method">
        <p>Refunds are issued to the original payment method used at checkout:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Prepaid (Razorpay)</strong> — refunded to the same card, UPI ID, or bank account.</li>
          <li><strong>Cash on Delivery</strong> — refunded to a UPI ID or bank account you provide. The COD handling fee is non-refundable.</li>
        </ul>
      </Section>

      <Section id="cancel-before" title="6. Cancellation Before Shipping">
        <p>Write to us as soon as possible. If the order has not yet been dispatched, we will cancel it and refund the full amount.</p>
      </Section>

      <Section id="cancel-after" title="7. Cancellation After Shipping">
        <p>Once dispatched, an order cannot be cancelled. Please refuse the delivery at your door or raise a return once it arrives.</p>
      </Section>

      <Section id="exchange" title="8. Exchange Process">
        <p>Size exchanges are subject to stock availability. Request an exchange within the 7-day window; if the size is unavailable, we will issue a refund instead. Exchanges are dispatched once we receive and approve the returned item.</p>
      </Section>

      <Section id="non-returnable" title="9. Non-returnable Items">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Items marked "Final Sale" at checkout</li>
          <li>Innerwear, socks, or hygiene-sensitive items</li>
          <li>Gift cards</li>
          <li>Items damaged after delivery through misuse or improper care</li>
        </ul>
      </Section>

      <Section id="damaged" title="10. Damaged or Incorrect Products">
        <Callout tone="warn">
          If your order arrives damaged or you received the wrong item, report it within <strong>48 hours</strong> of delivery with photos, video, and your order number. We will arrange a replacement or a full refund at no cost to you.
        </Callout>
      </Section>

      <Section id="return-shipping" title="11. Return Shipping">
        <p>For approved returns, we arrange a reverse pickup where our courier partner services your pincode. A flat return-shipping fee of ₹99 is deducted from the refund. If your pincode is not serviceable, you may self-ship to the address we share; we will reimburse standard courier costs on receipt of a bill.</p>
        <p>Return shipping is <strong>free</strong> for damaged, defective, or incorrect items.</p>
      </Section>

      <Section id="contact" title="12. Contact">
        <p>To initiate a return, write to <a href={`mailto:${BUSINESS.email}`} className="underline decoration-ember underline-offset-4">{BUSINESS.email}</a> or use the <Link to="/contact" className="underline decoration-ember underline-offset-4">Contact page</Link>.</p>
      </Section>
    </LegalLayout>
  );
}
