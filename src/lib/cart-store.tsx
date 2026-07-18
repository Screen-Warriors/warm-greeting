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
};

type CartCtx = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  const add: CartCtx["add"] = useCallback((item) => {
    setItems((prev) => {
      const key = `${item.productId}-${item.size}-${item.color}`;
      const existing = prev.find((p) => p.id === key);
      if (existing) {
        return prev.map((p) => p.id === key ? { ...p, quantity: p.quantity + item.quantity } : p);
      }
      return [...prev, { ...item, id: key }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);
  const updateQty = useCallback((id: string, qty: number) => {
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
  }, []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  const value = useMemo(() => ({ items, open, setOpen, add, remove, updateQty, clear, count, subtotal }),
    [items, open, add, remove, updateQty, clear, count, subtotal]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export { PRODUCT };
