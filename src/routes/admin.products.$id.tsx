import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/admin-client";
import { PageHeader } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { formatINR } from "@/lib/admin-csv";
import { ArrowLeft, Trash2, UploadCloud } from "lucide-react";

export const Route = createFileRoute("/admin/products/$id")({ component: ProductEditPage });

function ProductEditPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["admin", "products", id],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    compare_at_price: 0,
    is_active: true,
    stock_by_size: {} as Record<string, number>,
    images: [] as string[],
    sizes: [] as string[],
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price || 0),
        compare_at_price: Number(product.compare_at_price || 0),
        is_active: !!product.is_active,
        stock_by_size: (product.stock_by_size ?? {}) as Record<string, number>,
        images: (product.images ?? []) as string[],
        sizes: (product.sizes ?? []) as string[],
      });
    }
  }, [product]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseAdmin.from("products").update({
        name: form.name,
        description: form.description,
        price: form.price,
        compare_at_price: form.compare_at_price || null,
        is_active: form.is_active,
        stock_by_size: form.stock_by_size,
        images: form.images,
        sizes: form.sizes,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onUpload(file: File) {
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await supabaseAdmin.storage.from("product-images").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, images: [...f.images, pub.publicUrl] }));
    toast.success("Image uploaded");
  }

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!product) return <div className="text-sm text-muted-foreground">Product not found.</div>;

  return (
    <div>
      <div className="mb-4">
        <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to products
        </Link>
      </div>
      <PageHeader
        title={form.name || "Product"}
        subtitle={formatINR(form.price)}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <span className="text-xs">{form.is_active ? "Active" : "Inactive"}</span>
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4 bg-card/40 space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5 bg-background/40 h-10" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1.5 bg-background/40 min-h-[120px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wider">Price (₹)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className="mt-1.5 bg-background/40 h-10 font-mono" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Compare at (₹)</Label>
                <Input type="number" value={form.compare_at_price} onChange={(e) => setForm((f) => ({ ...f, compare_at_price: Number(e.target.value) }))} className="mt-1.5 bg-background/40 h-10 font-mono" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Stock by size</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {form.sizes.map((sz) => (
                <div key={sz}>
                  <Label className="text-[10px] uppercase tracking-wider font-mono">{sz}</Label>
                  <Input
                    type="number"
                    value={form.stock_by_size[sz] ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, stock_by_size: { ...f.stock_by_size, [sz]: Number(e.target.value) } }))}
                    className="mt-1 bg-background/40 h-9 font-mono"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Images</div>
            <div className="space-y-2 mb-3">
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <img src={url} alt="" className="h-10 w-10 object-cover rounded border border-border/60" />
                  <span className="flex-1 truncate font-mono text-muted-foreground">{url}</span>
                  <Button variant="ghost" size="sm" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              {form.images.length === 0 && <div className="text-xs text-muted-foreground">No images yet.</div>}
            </div>
            <label className="flex items-center justify-center gap-2 h-10 border border-dashed border-border/70 rounded cursor-pointer hover:bg-foreground/5 text-xs">
              <UploadCloud className="h-4 w-4" />
              Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
            </label>
          </Card>
        </div>
      </div>
    </div>
  );
}
