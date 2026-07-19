import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader, StatusBadge } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV } from "@/lib/admin-csv";
import { Download, Trash2, Mail, Archive, Reply, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/messages")({ component: MessagesPage });

type Msg = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied" | "archived";
  created_at: string;
};

const STATUSES: Array<Msg["status"] | "all"> = ["all", "unread", "read", "replied", "archived"];
const PAGE_SIZE = 20;

function MessagesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Msg["status"] | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Msg | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (status !== "all") rows = rows.filter((r) => r.status === status);
    const q = search.trim().toLowerCase();
    if (q) rows = rows.filter((r) =>
      [r.name, r.email, r.subject, r.message].some((v) => v?.toLowerCase().includes(q)),
    );
    return rows;
  }, [data, status, search]);

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const unread = (data ?? []).filter((r) => r.status === "unread").length;

  const setStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Msg["status"] }) => {
      const { error } = await supabaseAdmin.from("contact_submissions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
    onError: () => toast.error("Couldn't update message."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.from("contact_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      setSelected(null);
      toast.success("Message deleted.");
    },
    onError: () => toast.error("Couldn't delete."),
  });

  const openMessage = (m: Msg) => {
    setSelected(m);
    if (m.status === "unread") setStatusMutation.mutate({ id: m.id, status: "read" });
  };

  return (
    <div>
      <PageHeader
        title="Customer Messages"
        subtitle={`${data?.length ?? 0} total · ${unread} unread`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(
                `messages-${new Date().toISOString().slice(0, 10)}.csv`,
                filtered.map((r) => ({
                  name: r.name, email: r.email, phone: r.phone ?? "",
                  subject: r.subject, message: r.message, status: r.status,
                  created_at: r.created_at,
                })),
              )
            }
          >
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0); }}
            className={cn(
              "px-3 py-1.5 text-xs uppercase tracking-wider font-mono border transition-colors",
              status === s ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
        <div className="ml-auto w-full sm:w-64">
          <Input
            placeholder="Search name, email, subject…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      <Card className="bg-card/40 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr className="border-b border-border/60">
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">From</th>
              <th className="text-left px-4 py-2 font-medium">Subject</th>
              <th className="text-left px-4 py-2 font-medium">Received</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-4"><Skeleton className="h-6 w-full" /></td></tr>}
            {!isLoading && pageRows.map((r) => (
              <tr
                key={r.id}
                onClick={() => openMessage(r)}
                className={cn(
                  "border-b border-border/40 hover:bg-foreground/5 cursor-pointer",
                  r.status === "unread" && "bg-foreground/[0.03] font-medium",
                )}
              >
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-2">
                  <div>{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.email}</div>
                </td>
                <td className="px-4 py-2 max-w-[280px] truncate">{r.subject}</td>
                <td className="px-4 py-2 text-muted-foreground text-xs">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <a
                    onClick={(e) => e.stopPropagation()}
                    href={`mailto:${r.email}?subject=${encodeURIComponent("Re: " + r.subject)}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mr-3"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </a>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this message?")) deleteMutation.mutate(r.id); }}
                    className="text-xs text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && pageRows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No messages match.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Page {page + 1} of {pages} · {total} messages</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <Card className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <StatusBadge status={selected.status} />
                <h3 className="text-xl font-semibold mt-2">{selected.subject}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  From <span className="text-foreground">{selected.name}</span> · <span className="font-mono">{selected.email}</span>
                  {selected.phone && <> · <span className="font-mono">{selected.phone}</span></>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-foreground/[0.03] border border-border/60 rounded p-4">
              {selected.message}
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button asChild size="sm">
                <a href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: " + selected.subject)}`}>
                  <Reply className="h-4 w-4 mr-1.5" /> Reply
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusMutation.mutate({ id: selected.id, status: "replied" })}>
                <Check className="h-4 w-4 mr-1.5" /> Mark replied
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusMutation.mutate({ id: selected.id, status: "read" })}>
                <Mail className="h-4 w-4 mr-1.5" /> Mark read
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusMutation.mutate({ id: selected.id, status: "archived" })}>
                <Archive className="h-4 w-4 mr-1.5" /> Archive
              </Button>
              <Button variant="outline" size="sm" className="ml-auto text-red-400 hover:text-red-300"
                onClick={() => { if (confirm("Delete this message?")) deleteMutation.mutate(selected.id); }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
