import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";

type AdminAuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AdminAuthCtx = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function checkAdmin(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
    const { data } = await supabaseAdmin
      .from("admin_users")
      .select("user_id")
      .eq("user_id", uid)
      .maybeSingle();
    return !!data;
  }

  useEffect(() => {
    let mounted = true;
    supabaseAdmin.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsAdmin(await checkAdmin(data.session?.user.id));
      setLoading(false);
    });
    const { data: sub } = supabaseAdmin.auth.onAuthStateChange(async (_e, sess) => {
      setSession(sess);
      setIsAdmin(await checkAdmin(sess?.user.id));
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AdminAuthState = {
    loading,
    session,
    user: session?.user ?? null,
    isAdmin,
    async signIn(email, password) {
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      const ok = await checkAdmin(data.user?.id);
      if (!ok) {
        await supabaseAdmin.auth.signOut();
        return { error: "This account is not authorized for admin access." };
      }
      setIsAdmin(true);
      return {};
    },
    async signOut() {
      await supabaseAdmin.auth.signOut();
      setSession(null);
      setIsAdmin(false);
    },
  };

  return <AdminAuthCtx.Provider value={value}>{children}</AdminAuthCtx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
