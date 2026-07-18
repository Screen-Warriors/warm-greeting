import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reviews")({ component: ReviewsPage });

function ReviewsPage() {
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: async () => {
      let q = supabaseAdmin.from("reviews").select("*").order("created_at", { ascending: false });
      if (filter === "pending") q = q.eq("is_approved", false);
      if (filter === "approved") q = q.eq("is_approved", true);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from("reviews").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review approved"); qc.invalidateQueries({ queryKey: ["admin", "reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Review deleted"); qc.invalidateQueries({ queryKey: ["admin", "reviews"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle="Moderate customer submissions."
        actions={
          <div className="flex gap-1">
            {(["pending", "approved", "all"] as const).map((f) => (
              <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
                {f}
              </Button>
            ))}
          </div>
        }
      />

      <div className="space-y-3">
        {isLoading && <Skeleton className="h-20 w-full" />}
        {!isLoading && (data ?? []).map((r) => (
          <Card key={r.id} className="p-4 bg-card/40">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-medium">{r.reviewer_name}</div>
                  {r.city && <div className="text-xs text-muted-foreground">· {r.city}</div>}
                  <div className="flex ml-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < Number(r.rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40")} />
                    ))}
                  </div>
                  <span className={cn(
                    "ml-auto text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border",
                    r.is_approved
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : "border-amber-500/30 text-amber-400 bg-amber-500/10",
                  )}>
                    {r.is_approved ? "approved" : "pending"}
                  </span>
                </div>
                {r.title && <div className="text-sm font-medium mb-1">{r.title}</div>}
                <p className="text-sm text-muted-foreground">{r.comment}</p>
                {r.image_url && <img src={r.image_url} alt="" className="mt-2 h-20 w-20 rounded object-cover" />}
                <div className="mt-2 text-[10px] text-muted-foreground font-mono">
                  {new Date(r.created_at as string).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {!r.is_approved && (
                  <Button size="sm" onClick={() => approve.mutate(r.id)}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this review?")) remove.mutate(r.id); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <Card className="p-8 bg-card/40 text-center text-sm text-muted-foreground">No reviews.</Card>
        )}
      </div>
    </div>
  );
}
