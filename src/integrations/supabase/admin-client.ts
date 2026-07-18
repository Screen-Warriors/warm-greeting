import { createClient } from "@supabase/supabase-js";

// Separate Supabase client for the /admin surface. Persists sessions so admins
// stay signed in across reloads. The storefront client keeps
// persistSession=false so anonymous checkout is untouched.
const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const fetchShim: typeof fetch = (input, init) => {
  const headers = new Headers(init?.headers);
  // Opaque sb_ publishable keys aren't JWTs — PostgREST rejects them if sent
  // as a Bearer. But once the admin is signed in, supabase-js sets
  // Authorization to the user's *access token* (a real JWT), which we MUST
  // keep. Only strip Authorization if it equals the raw publishable key.
  if (key?.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
    headers.delete("Authorization");
  }
  headers.set("apikey", key);
  return fetch(input, { ...init, headers });
};

export const supabaseAdmin = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "nickyboy-admin-auth",
    detectSessionInUrl: false,
  },
  global: { fetch: fetchShim },
});
