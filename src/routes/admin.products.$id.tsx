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
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/admin-csv";
import { ArrowLeft, Trash2, UploadCloud, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/$id")({ component: ProductEditPage });

type ColorItem = { name: string; value?: string };

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const LOW_STOCK_THRESHOLD = 5;

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
    colors: [] as ColorItem[],
  });

  const [customSize, setCustomSize] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorValue, setNewColorValue] = useState("#000000");

  useEffect(() => {
    if (product) {
      // Normalize colors: schema stores jsonb; could be array of strings or {name,value}.
      const rawColors = (product.colors ?? []) as unknown[];
      const colors: ColorItem[] = rawColors.map((c) => {
        if (typeof c === "string") return { name: c };
        if (c && typeof c === "object") {
          const o = c as { name?: string; value?: string };
          return { name: o.name ?? "", value: o.value };
        }
        return { name: String(c) };
      }).filter((c) => c.name);

      setForm({
        name: product.name || "",
        description: product.description || "",
        price: Number(product.price || 0),
        compare_at_price: Number(product.compare_at_price || 0),
        is_active: !!product.is_active,
        stock_by_size: (product.stock_by_size ?? {}) as Record<string, number>,
        images: (product.images ?? []) as string[],
        sizes: (product.sizes ?? []) as string[],
        colors,
      });
    }
  }, [product]);

  // --- Size handlers: keep sizes and stock_by_size in sync ---
  function toggleSize(sz: string) {
    setForm((f) => {
      const has = f.sizes.includes(sz);
      if (has) {
        const nextSizes = f.sizes.filter((s) => s !== sz);
        const nextStock = { ...f.stock_by_size };
        delete nextStock[sz];
        return { ...f, sizes: nextSizes, stock_by_size: nextStock };
      }
      return {
        ...f,
        sizes: [...f.sizes, sz],
        stock_by_size: { ...f.stock_by_size, [sz]: f.stock_by_size[sz] ?? 0 },
      };
    });
  }

  function addCustomSize() {
    const s = customSize.trim().toUpperCase();
    if (!s) return;
    if (form.sizes.includes(s)) { toast.error(`Size ${s} already exists`); return; }
    setForm((f) => ({
      ...f,
      sizes: [...f.sizes, s],
      stock_by_size: { ...f.stock_by_size, [s]: 0 },
    }));
    setCustomSize("");
  }

  function setStock(sz: string, val: number) {
    setForm((f) => ({ ...f, stock_by_size: { ...f.stock_by_size, [sz]: Math.max(0, val) } }));
  }

  // --- Color handlers ---
  function addColor() {
    const name = newColorName.trim();
    if (!name) return;
    if (form.colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error(`Color "${name}" already exists`);
      return;
    }
    setForm((f) => ({ ...f, colors: [...f.colors, { name, value: newColorValue || undefined }] }));
    setNewColorName("");
    setNewColorValue("#000000");
  }

  function removeColor(name: string) {
    setForm((f) => ({ ...f, colors: f.colors.filter((c) => c.name !== name) }));
  }

  const save = useMutation({
    mutationFn: async () => {
      // Prune stock keys to only currently selected sizes (defensive).
      const cleanStock: Record<string, number> = {};
      for (const s of form.sizes) cleanStock[s] = Number(form.stock_by_size[s] ?? 0);

      const { error } = await supabaseAdmin.from("products").update({
        name: form.name,
        description: form.description,
        price: form.price,
        compare_at_price: form.compare_at_price || null,
        is_active: form.is_active,
        stock_by_size: cleanStock,
        images: form.images,
        sizes: form.sizes,
        colors: form.colors,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product saved");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      qc.invalidateQueries({ queryKey: ["storefront", "product"] });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save product"),
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
              {save.isPending ? "Saving…" : "Save Changes"}
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

          {/* Sizes multi-select */}
          <Card className="p-4 bg-card/40 space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Sizes</div>
              <div className="text-[10px] text-muted-foreground font-mono">{form.sizes.length} selected</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES.map((sz) => {
                const active = form.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={cn(
                      "h-9 min-w-[44px] px-3 border font-mono text-xs transition-all inline-flex items-center gap-1.5",
                      active
                        ? "border-ember bg-ember/10 text-ember"
                        : "border-border/70 text-muted-foreground hover:text-foreground hover:border-foreground/60"
                    )}
                  >
                    {active && <Check className="h-3 w-3" />}
                    {sz}
                  </button>
                );
              })}
              {form.sizes.filter((s) => !PRESET_SIZES.includes(s)).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => toggleSize(sz)}
                  className="h-9 px-3 border border-ember bg-ember/10 text-ember font-mono text-xs inline-flex items-center gap-1.5"
                >
                  <Check className="h-3 w-3" />
                  {sz}
                  <X className="h-3 w-3 ml-1 opacity-70" />
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                placeholder="Add custom size (e.g. 4XL)"
                className="bg-background/40 h-9 font-mono text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={addCustomSize} className="h-9">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </Card>

          {/* Per-size stock */}
          <Card className="p-4 bg-card/40">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Stock by size</div>
            {form.sizes.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded">
                Select at least one size above to manage stock.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {form.sizes.map((sz) => {
                  const qty = Number(form.stock_by_size[sz] ?? 0);
                  const out = qty === 0;
                  const low = qty > 0 && qty < LOW_STOCK_THRESHOLD;
                  return (
                    <div key={sz} className="border border-border/60 rounded p-2.5 bg-background/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] uppercase tracking-wider font-mono">{sz}</Label>
                        {out && <Badge variant="destructive" className="h-4 text-[9px] px-1.5">Out</Badge>}
                        {low && <Badge className="h-4 text-[9px] px-1.5 bg-ember text-ink hover:bg-ember">Low</Badge>}
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={qty}
                        onChange={(e) => setStock(sz, Number(e.target.value))}
                        className="bg-background/40 h-9 font-mono"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Colors */}
          <Card className="p-4 bg-card/40 space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Colors</div>
            <div className="flex flex-wrap gap-2">
              {form.colors.length === 0 && (
                <div className="text-xs text-muted-foreground">No colors yet.</div>
              )}
              {form.colors.map((c) => (
                <div key={c.name} className="inline-flex items-center gap-2 h-9 pl-1.5 pr-1 border border-border/70 rounded bg-background/30">
                  <span
                    className="inline-block w-6 h-6 rounded-sm border border-border/60"
                    style={{ background: c.value || "transparent" }}
                    aria-hidden
                  />
                  <span className="text-xs font-mono">{c.name}</span>
                  {c.value && <span className="text-[10px] text-muted-foreground font-mono">{c.value}</span>}
                  <button
                    type="button"
                    onClick={() => removeColor(c.name)}
                    className="ml-1 h-6 w-6 grid place-items-center rounded hover:bg-foreground/10 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${c.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }}
                placeholder="Color name (e.g. Ink Black)"
                className="bg-background/40 h-9 text-xs"
              />
              <input
                type="color"
                value={newColorValue}
                onChange={(e) => setNewColorValue(e.target.value)}
                className="h-9 w-12 bg-background/40 border border-border/70 rounded cursor-pointer"
                aria-label="Color swatch"
              />
              <Button type="button" variant="outline" size="sm" onClick={addColor} className="h-9">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
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
