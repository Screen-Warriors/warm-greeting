import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader, StatusBadge } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/admin-csv";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/orders/$id")({ component: OrderDetailPage });

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

function OrderDetailPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "orders", id],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from("orders").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [orderStatus, setOrderStatus] = useState("pending");
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status || order.status || "pending");
      setTracking(order.tracking_number || "");
      setNotes(order.admin_notes || "");
    }
  }, [order]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseAdmin
        .from("orders")
        .update({ order_status: orderStatus, tracking_number: tracking || null, admin_notes: notes || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!order) return <div className="text-sm text-muted-foreground">Order not found.</div>;

  const items = (order.items ?? []) as Array<{ name?: string; size?: string; qty?: number; price?: number; image?: string }>;
  const addr = (order.shipping_address ?? {}) as Record<string, string>;

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin/orders" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </Link>
      </div>
      <PageHeader
        title={`Order ${String(order.id).slice(0, 8)}`}
        subtitle={new Date(order.created_at as string).toLocaleString()}
        actions={
          <div className="flex gap-2">
            <StatusBadge status={order.payment_status} />
            <StatusBadge status={order.order_status || order.status} />
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Items</div>
            <ul className="divide-y divide-border/60">
              {items.map((it, i) => (
                <li key={i} className="py-2 flex justify-between text-sm">
                  <div>
                    <div>{it.name || "Item"}</div>
                    <div className="text-xs text-muted-foreground font-mono">Size {it.size} · Qty {it.qty}</div>
                  </div>
                  <div className="font-mono">{formatINR(Number(it.price ?? 0) * Number(it.qty ?? 1))}</div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-border/60 space-y-1 text-sm">
              <Row label="Subtotal" value={formatINR(Number(order.subtotal))} />
              {Number(order.discount) > 0 && <Row label="Discount" value={`− ${formatINR(Number(order.discount))}`} />}
              {Number(order.shipping) > 0 && <Row label="Shipping" value={formatINR(Number(order.shipping))} />}
              {Number(order.cod_fee) > 0 && <Row label="COD fee" value={formatINR(Number(order.cod_fee))} />}
              <Row label="Total" value={formatINR(Number(order.total))} bold />
            </div>
          </Card>

          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Shipping address</div>
            <div className="text-sm space-y-0.5">
              <div>{order.customer_name}</div>
              {addr.line1 && <div>{addr.line1}</div>}
              {addr.line2 && <div>{addr.line2}</div>}
              <div>{[addr.city, addr.state, addr.pincode || addr.postal_code || addr.zip].filter(Boolean).join(", ")}</div>
              {addr.country && <div>{addr.country}</div>}
              <div className="pt-2 text-xs text-muted-foreground font-mono">
                {order.full_phone_number || order.phone} · {order.email}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Payment (read-only)</div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <Row label="Method" value={order.payment_method} />
              <Row label="Payment status" value={order.payment_status} />
              <Row label="Razorpay order" value={order.razorpay_order_id || "—"} />
              <Row label="Razorpay payment" value={order.razorpay_payment_id || "—"} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Fulfillment</div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Order status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger className="mt-1.5 bg-background/40 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Tracking number</Label>
                <Input value={tracking} onChange={(e) => setTracking(e.target.value)} className="mt-1.5 bg-background/40 h-10 font-mono" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Internal notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 bg-background/40 min-h-[100px]" />
              </div>
              <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
