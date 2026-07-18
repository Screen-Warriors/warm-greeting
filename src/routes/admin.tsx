import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminLogin } from "@/components/admin/admin-login";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin Console — NICKY BOY" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminAuthProvider>
      <AdminGate />
    </AdminAuthProvider>
  );
}

function AdminGate() {
  const { loading, session, isAdmin } = useAdminAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xs uppercase tracking-[0.28em] font-mono text-muted-foreground animate-pulse">
          Authenticating…
        </div>
      </div>
    );
  }
  if (!session || !isAdmin) return <AdminLogin />;
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
