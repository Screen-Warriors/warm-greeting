import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader, StatusBadge } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV, formatINR } from "@/lib/admin-csv";
import { Download, Search } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: OrdersPage });

const STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "paid", "failed"];
const PAGE = 25;

function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (data ?? []).filter((o) => {
      if (status !== "all") {
        const s1 = (o.order_status || o.status || "").toLowerCase();
        const s2 = (o.payment_status || "").toLowerCase();
        if (s1 !== status && s2 !== status) return false;
      }
      if (!query) return true;
      return (
        String(o.id).toLowerCase().includes(query) ||
        String(o.customer_name || "").toLowerCase().includes(query) ||
        String(o.email || "").toLowerCase().includes(query) ||
        String(o.phone || "").toLowerCase().includes(query)
      );
    });
  }, [data, q, status]);

  const paged = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));

  function onExport() {
    downloadCSV(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      filtered.map((o) => ({
        id: o.id,
        created_at: o.created_at,
        customer_name: o.customer_name,
        email: o.email,
        phone: o.full_phone_number || o.phone,
        total: o.total,
        currency: o.currency,
        payment_method: o.payment_method,
        payment_status: o.payment_status,
        order_status: o.order_status || o.status,
        tracking_number: o.tracking_number,
        sizes: o.sizes,
        razorpay_order_id: o.razorpay_order_id,
        razorpay_payment_id: o.razorpay_payment_id,
        shipping_address: o.shipping_address,
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${filtered.length} order${filtered.length === 1 ? "" : "s"}`}
        actions={
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <Card className="p-3 mb-4 bg-card/40 flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, or order id…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            className="pl-8 h-9 bg-background/40"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="md:w-48 h-9 bg-background/40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card className="bg-card/40">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2 font-medium">Order</th>
                <th className="text-left px-4 py-2 font-medium">Customer</th>
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Sizes</th>
                <th className="text-left px-4 py-2 font-medium">Total</th>
                <th className="text-left px-4 py-2 font-medium">Payment</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-2"><Skeleton className="h-5 w-full" /></td></tr>
              ))}
              {!isLoading && paged.map((o) => (
                <tr key={o.id} className="border-b border-border/40 hover:bg-foreground/5">
                  <td className="px-4 py-2 font-mono text-xs">
                    <Link to="/admin/orders/$id" params={{ id: o.id }} className="hover:underline">
                      {String(o.id).slice(0, 8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{o.customer_name}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{o.email}</td>
                  <td className="px-4 py-2 font-mono text-xs">{o.sizes || "—"}</td>
                  <td className="px-4 py-2 font-mono">{formatINR(Number(o.total))}</td>
                  <td className="px-4 py-2"><StatusBadge status={o.payment_status} /></td>
                  <td className="px-4 py-2"><StatusBadge status={o.order_status || o.status} /></td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(o.created_at as string).toLocaleDateString()}</td>
                </tr>
              ))}
              {!isLoading && paged.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
            <div>Page {page + 1} of {pageCount}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
