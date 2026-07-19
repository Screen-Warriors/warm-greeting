export const LAST_UPDATED = new Date().toLocaleDateString("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export const BUSINESS = {
  name: "NICKY BOY",
  legalName: "NICKY BOY LABEL",
  addressLine1: "Studio 3F",
  addressLine2: "Indiranagar, Bengaluru",
  addressLine3: "India — 560038",
  email: "moneywithgenz@gmail.com",
  currency: "INR",
  country: "India",
  gateway: "Razorpay",
} as const;
