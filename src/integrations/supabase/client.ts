import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn("[supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
}

// Publishable (sb_) keys are opaque; strip the default Bearer header PostgREST
// tries to parse as a JWT — send only `apikey`.
const fetchShim: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  if (key?.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", key);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: fetchShim },
});

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = key;
