import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Size } from "./product";
import { PRODUCT } from "./product";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  size: Size;
  color: string;
  price: number;
  quantity: number;
  image: string;
  maxStock?: number;
};

export type AddResult = { ok: true } | { ok: false; error: string; available?: number };

type CartCtx = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "id">) => AddResult;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => { ok: boolean; clamped?: boolean; available?: number };
  clear: () => void;
  count: number;
  subtotal: number;
  qtyForSize: (productId: string, size: Size) => number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const add: CartCtx["add"] = useCallback((item) => {
    const key = `${item.productId}-${item.size}-${item.color}`;
    let result: AddResult = { ok: true };
    setItems((prev) => {
      const existing = prev.find((p) => p.id === key);
      const currentQty = existing?.quantity ?? 0;
      const requestedTotal = currentQty + item.quantity;
      const max = item.maxStock;
      if (typeof max === "number" && requestedTotal > max) {
        result = {
          ok: false,
          error:
            currentQty >= max
              ? `Only ${max} in stock — you've reached the maximum available.`
              : `Only ${max} in stock — you already have ${currentQty} in your bag.`,
          available: max,
        };
        return prev;
      }
      if (existing) {
        return prev.map((p) => (p.id === key ? { ...p, quantity: requestedTotal, maxStock: max ?? p.maxStock } : p));
      }
      return [...prev, { ...item, id: key }];
    });
    if (result.ok) setOpen(true);
    return result;
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);

  const updateQty: CartCtx["updateQty"] = useCallback((id, qty) => {
    let out: { ok: boolean; clamped?: boolean; available?: number } = { ok: true };
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const nextRaw = Math.max(1, qty);
        const max = i.maxStock;
        if (typeof max === "number" && nextRaw > max) {
          out = { ok: false, clamped: true, available: max };
          return { ...i, quantity: max };
        }
        return { ...i, quantity: nextRaw };
      }),
    );
    return out;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  const qtyForSize = useCallback(
    (productId: string, size: Size) =>
      items.filter((i) => i.productId === productId && i.size === size).reduce((n, i) => n + i.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({ items, open, setOpen, add, remove, updateQty, clear, count, subtotal, qtyForSize }),
    [items, open, add, remove, updateQty, clear, count, subtotal, qtyForSize],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export { PRODUCT };
