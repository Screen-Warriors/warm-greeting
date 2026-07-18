import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader, StatusBadge } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/admin-csv";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

const LOW_STOCK_THRESHOLD = 5;

function DashboardPage() {
  const ordersQ = useQuery({
    queryKey: ["admin", "orders", "all"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("id, customer_name, email, total, payment_status, order_status, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["admin", "reviews", "pending-count"],
    queryFn: async () => {
      const { count, error } = await supabaseAdmin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const newsletterQ = useQuery({
    queryKey: ["admin", "newsletter", "count"],
    queryFn: async () => {
      const { count, error } = await supabaseAdmin
        .from("newsletter_signups")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const productsQ = useQuery({
    queryKey: ["admin", "products", "low-stock"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from("products").select("id, name, stock_by_size");
      if (error) throw error;
      return data ?? [];
    },
  });

  const orders = ordersQ.data ?? [];
  const paidOrders = orders.filter((o) => o.payment_status === "paid");
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingCount = orders.filter((o) => (o.order_status || o.status) === "pending").length;
  const today = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((o) => (o.created_at as string).startsWith(today)).length;
  const aov = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

  const lowStock: { product: string; size: string; qty: number }[] = [];
  for (const p of productsQ.data ?? []) {
    const sbs = (p.stock_by_size ?? {}) as Record<string, number>;
    for (const [size, qty] of Object.entries(sbs)) {
      if (Number(qty) < LOW_STOCK_THRESHOLD) lowStock.push({ product: p.name, size, qty: Number(qty) });
    }
  }

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Snapshot of the drop." />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Metric label="Total orders" value={ordersQ.isLoading ? null : orders.length} />
        <Metric label="Revenue (paid)" value={ordersQ.isLoading ? null : formatINR(totalRevenue)} />
        <Metric label="Pending" value={ordersQ.isLoading ? null : pendingCount} />
        <Metric label="Today" value={ordersQ.isLoading ? null : todaysOrders} />
        <Metric label="AOV" value={ordersQ.isLoading ? null : formatINR(aov)} />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 bg-card/40">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Pending reviews</div>
          <div className="text-2xl font-semibold">{reviewsQ.data ?? "—"}</div>
        </Card>
        <Card className="p-4 bg-card/40">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Newsletter signups</div>
          <div className="text-2xl font-semibold">{newsletterQ.data ?? "—"}</div>
        </Card>
        <Card className="p-4 bg-card/40">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Low stock alerts
          </div>
          {lowStock.length === 0 ? (
            <div className="text-sm text-muted-foreground">All good.</div>
          ) : (
            <ul className="space-y-1 text-sm max-h-24 overflow-auto">
              {lowStock.map((l, i) => (
                <li key={i} className="flex justify-between">
                  <span className="truncate mr-2">{l.product} · {l.size}</span>
                  <span className="font-mono text-amber-400">{l.qty}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="bg-card/40">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div className="text-sm font-medium">Recent orders</div>
          <Link to="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2 font-medium">Order</th>
                <th className="text-left px-4 py-2 font-medium">Customer</th>
                <th className="text-left px-4 py-2 font-medium">Total</th>
                <th className="text-left px-4 py-2 font-medium">Payment</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {ordersQ.isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td colSpan={6} className="px-4 py-2"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))}
              {!ordersQ.isLoading && orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-b border-border/40 hover:bg-foreground/5">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="text-foreground hover:underline">
                      {String(o.id).slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{o.customer_name}</td>
                  <td className="px-4 py-2 font-mono">{formatINR(Number(o.total))}</td>
                  <td className="px-4 py-2"><StatusBadge status={o.payment_status} /></td>
                  <td className="px-4 py-2"><StatusBadge status={o.order_status || o.status} /></td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(o.created_at as string).toLocaleString()}</td>
                </tr>
              ))}
              {!ordersQ.isLoading && orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode | null }) {
  return (
    <Card className="p-4 bg-card/40">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <div className="text-xl font-semibold font-mono">
        {value === null ? <Skeleton className="h-6 w-16" /> : value}
      </div>
    </Card>
  );
}
