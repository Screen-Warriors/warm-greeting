import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT } from "@/lib/product";

export type LivePricing = {
  price: number;
  compareAt: number;
  discountPct: number;
  currency: string;
  isLoading: boolean;
};

export function useLivePricing(): LivePricing {
  const { data, isLoading } = useQuery({
    queryKey: ["storefront", "product", PRODUCT.id, "pricing"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("price,compare_at_price")
        .eq("id", PRODUCT.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const price = Number(data?.price ?? PRODUCT.price);
  const compareAt = Number(data?.compare_at_price ?? PRODUCT.compareAt);
  const discountPct =
    compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

  return { price, compareAt, discountPct, currency: PRODUCT.currency, isLoading };
}
