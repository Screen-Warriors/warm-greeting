import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Package, Star, Mail, MessageSquare, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useAdminAuth } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border/60 bg-card/40">
        <div className="px-5 py-5 border-b border-border/60">
          <div className="text-[10px] uppercase tracking-[0.32em] font-mono text-muted-foreground">NICKY BOY</div>
          <div className="text-sm font-semibold mt-0.5">Admin Console</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/60 px-3 py-3">
          <div className="px-2 pb-2 text-[11px] text-muted-foreground truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b border-border/60 bg-card/40 px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold">NICKY BOY / Admin</div>
          <Button variant="ghost" size="sm" onClick={() => signOut()}><LogOut className="h-4 w-4" /></Button>
        </header>
        <nav className="md:hidden flex overflow-x-auto border-b border-border/60 bg-card/20">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-4 py-2.5 text-xs whitespace-nowrap border-b-2",
                  active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || "pending").toLowerCase();
  const cls =
    s === "paid" || s === "delivered" || s === "approved"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : s === "shipped" || s === "confirmed" || s === "processing"
        ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
        : s === "failed" || s === "cancelled" || s === "returned"
          ? "bg-red-500/15 text-red-400 border-red-500/30"
          : "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-mono border", cls)}>
      {s}
    </span>
  );
}
