export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv;charset=utf-8" });
    triggerDownload(filename, blob);
    return;
  }
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set()),
  );
  const esc = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    let s = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
  triggerDownload(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}

function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function formatINR(paise_or_rupees: number | null | undefined): string {
  const n = Number(paise_or_rupees ?? 0);
  return `₹${n.toLocaleString("en-IN")}`;
}
