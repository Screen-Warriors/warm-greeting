import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/admin-csv";

export const Route = createFileRoute("/admin/products/")({ component: ProductsPage });

function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage catalogue and stock." />
      <Card className="bg-card/40">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Price</th>
              <th className="text-left px-4 py-2 font-medium">Stock</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-4"><Skeleton className="h-6 w-full" /></td></tr>}
            {!isLoading && (data ?? []).map((p) => {
              const sbs = (p.stock_by_size ?? {}) as Record<string, number>;
              const totalStock = Object.values(sbs).reduce((a, b) => a + Number(b || 0), 0);
              return (
                <tr key={p.id} className="border-b border-border/40 hover:bg-foreground/5">
                  <td className="px-4 py-2">
                    <Link to="/admin/products/$id" params={{ id: p.id }} className="hover:underline">{p.name}</Link>
                  </td>
                  <td className="px-4 py-2 font-mono">{formatINR(Number(p.price))}</td>
                  <td className="px-4 py-2 font-mono">{totalStock}</td>
                  <td className="px-4 py-2">
                    <Badge variant={p.is_active ? "default" : "outline"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No products.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
