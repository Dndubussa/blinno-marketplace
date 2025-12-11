import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function usePurchasedProducts() {
  const { user } = useAuth();

  const { data: purchasedProducts = [], isLoading } = useQuery({
    queryKey: ["purchased-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("purchased_products")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching purchased products:", error);
        return [];
      }

      return data.map((p) => p.product_id);
    },
    enabled: !!user,
  });

  const hasPurchased = (productId: string) => {
    return purchasedProducts.includes(productId);
  };

  return {
    purchasedProducts,
    hasPurchased,
    isLoading,
  };
}
