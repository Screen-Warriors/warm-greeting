import heroModel from "@/assets/hero-model.png.asset.json";
import productFront from "@/assets/product-front.png.asset.json";
import productBack from "@/assets/product-back.png.asset.json";
import lifestyleSitting from "@/assets/lifestyle-sitting.jpg.asset.json";
import lifestyleLeaning from "@/assets/lifestyle-leaning.jpg.asset.json";
import detailPrint from "@/assets/detail-print.jpg";

export const IMAGES = {
  hero: heroModel.url,
  front: productFront.url,
  back: productBack.url,
  sitting: lifestyleSitting.url,
  leaning: lifestyleLeaning.url,
  detail: detailPrint,
};

export type Size = "S" | "M" | "L" | "XL" | "XXL";

export const PRODUCT = {
  id: "a1b2c3d4-0001-4000-8000-000000000001",
  name: "NICKY BOY / Signature Crewneck",
  sku: "NB—001 / DROP.01",
  tagline: "The signature drop.",
  description:
    "A heavyweight garment-dyed crewneck in matte black with contrast bone-white ribbing. Hand-drawn anime silhouette and cryptic rune column screen-printed on the chest. Cut boxy, worn oversized.",
  price: 2499,
  compareAt: 3299,
  currency: "₹",
  colors: [{ name: "Ink Black", value: "#0a0a0a" }] as const,
  sizes: ["S", "M", "L", "XL", "XXL"] satisfies Size[],
  stockBySize: { S: 12, M: 4, L: 0, XL: 8, XXL: 15 } as Record<Size, number>,
};

export const SIZE_CHART: Array<{ size: Size; chest: number; length: number; shoulder: number; sleeve: number }> = [
  { size: "S",   chest: 108, length: 68, shoulder: 54, sleeve: 60 },
  { size: "M",   chest: 114, length: 70, shoulder: 56, sleeve: 61 },
  { size: "L",   chest: 120, length: 72, shoulder: 58, sleeve: 62 },
  { size: "XL",  chest: 126, length: 74, shoulder: 60, sleeve: 63 },
  { size: "XXL", chest: 132, length: 76, shoulder: 62, sleeve: 64 },
];

export const REVIEWS = [
  { id: "r1", name: "Aarav M.", city: "Mumbai", rating: 5, date: "2 weeks ago", verified: true,
    title: "Fits exactly like the photos",
    body: "The weight of the fabric is unreal — feels like something twice the price. Boxy fit is spot on. Ran a load through cold wash, zero print cracking." },
  { id: "r2", name: "Ishaan K.", city: "Bengaluru", rating: 5, date: "1 month ago", verified: true,
    title: "That print goes hard",
    body: "The hand-drawn character up close is way sharper than the product page shows. Wore it three days straight. Getting stopped in the street." },
  { id: "r3", name: "Riya P.", city: "Delhi", rating: 4, date: "3 weeks ago", verified: true,
    title: "Sized down and it's perfect",
    body: "5'6, ordered S for a fitted-oversized look and it drops just right. Ribbing is chef's kiss. Shipping took 4 days to Delhi." },
  { id: "r4", name: "Kabir S.", city: "Hyderabad", rating: 5, date: "5 days ago", verified: true,
    title: "Actually feels like a drop, not a store buy",
    body: "Packaging alone earned the price. Dog-tag included as promised. This is the fifth NB piece I own and they keep raising the bar." },
  { id: "r5", name: "Zara F.", city: "Pune", rating: 5, date: "1 week ago", verified: true,
    title: "Heavyweight and warm",
    body: "Perfect for late monsoon nights. Doesn't pill, doesn't fade. My boyfriend already stole it." },
];

export const FAQ = [
  { q: "When does this ship?", a: "Every order ships within 48 hours from our Bengaluru studio. Metro deliveries land in 3–5 working days, rest of India 5–8 days. You'll get a tracking link on WhatsApp and email the moment your parcel leaves us." },
  { q: "How does the fit run?", a: "The cut is intentionally boxy and drop-shouldered — pattern-cut for a modern oversized silhouette. If you're between sizes and want a cleaner fit, size down. For a full oversized street look, take your usual size." },
  { q: "What's the return policy?", a: "Easy 7-day returns on unworn, unwashed pieces with the original tag and dog-tag intact. Exchanges are free within India — we cover both legs of shipping. Reach us at care@nickyboy.co and we'll pick it up." },
  { q: "Is the print going to crack or fade?", a: "The chest graphic is cured plastisol on garment-dyed heavyweight fleece. Cold wash inside-out, no tumble-dry, and it'll outlast the sweatshirt. We've tested pieces past 60 wash cycles." },
  { q: "Is checkout secure?", a: "Payments run through Razorpay — India's Verified Merchant gateway used by every major D2C brand. UPI, cards, netbanking, and wallets are supported. We never see or store your card details." },
  { q: "Care instructions?", a: "Machine wash cold, inside out, on a gentle cycle. Do not bleach. Dry flat in shade. Iron on reverse side, low heat. Do not iron directly over the print. Wash with similar dark colours the first two cycles." },
];
