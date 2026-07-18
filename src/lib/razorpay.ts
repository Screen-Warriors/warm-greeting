// Razorpay Checkout script loader + minimal types.
// Uses the OFFICIAL checkout.js script and public Key ID (VITE_RAZORPAY_KEY_ID).
// Key SECRET stays server-side in Supabase Edge Functions.

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

export type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (r: RazorpayHandlerResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
};
type RazorpayCtor = new (opts: RazorpayOptions) => RazorpayInstance;

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("razorpay_script_failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("razorpay_script_failed"));
    document.head.appendChild(s);
  });
  return loading;
}

export function openRazorpay(opts: RazorpayOptions) {
  if (!window.Razorpay) throw new Error("razorpay_not_loaded");
  const rzp = new window.Razorpay(opts);
  rzp.on("payment.failed", (resp) => {
    // eslint-disable-next-line no-console
    console.error("Razorpay payment.failed", resp);
  });
  rzp.open();
  return rzp;
}
