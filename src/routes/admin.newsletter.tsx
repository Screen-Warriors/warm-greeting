import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV } from "@/lib/admin-csv";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/newsletter")({ component: NewsletterPage });

function NewsletterPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "newsletter"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from("newsletter_signups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      <PageHeader
        title="Newsletter"
        subtitle={`${data?.length ?? 0} signups`}
        actions={
          <Button variant="outline" size="sm" onClick={() => downloadCSV(`newsletter-${new Date().toISOString().slice(0, 10)}.csv`, (data ?? []).map((r) => ({ email: r.email, created_at: r.created_at })))}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />
      <Card className="bg-card/40">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-2 font-medium">Email</th>
              <th className="text-left px-4 py-2 font-medium">Signed up</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={2} className="px-4 py-4"><Skeleton className="h-6 w-full" /></td></tr>}
            {!isLoading && (data ?? []).map((r) => (
              <tr key={r.id} className="border-b border-border/40 hover:bg-foreground/5">
                <td className="px-4 py-2 font-mono">{r.email}</td>
                <td className="px-4 py-2 text-muted-foreground text-xs">{new Date(r.created_at as string).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-sm text-muted-foreground">No signups yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
