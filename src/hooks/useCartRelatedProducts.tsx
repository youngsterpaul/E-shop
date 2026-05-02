import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PRODUCT_LIST_FIELDS } from '@/utils/queryOptimizations';

/**
 * Fetch products related to the items currently in the user's cart.
 * Looks up the categories of the cart items, then fetches other products
 * sharing any of those categories. Falls back to featured products.
 */
export const useCartRelatedProducts = (cartProductIds: string[], limit = 12) => {
  const sortedIds = [...cartProductIds].sort();
  return useQuery({
    queryKey: ['cart-related-products', sortedIds, limit],
    enabled: sortedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Get categories for the cart items
      const { data: cartProducts, error: catErr } = await supabase
        .from('products')
        .select('product_id, categories')
        .in('product_id', sortedIds);

      if (catErr) throw catErr;

      const categories = Array.from(
        new Set(
          (cartProducts || [])
            .map((p: any) => (p.categories || '').toString().trim())
            .filter(Boolean)
        )
      );

      let related: any[] = [];
      if (categories.length > 0) {
        // Build OR filter across all categories using ilike
        const orFilter = categories
          .map((c) => `categories.ilike.%${c.replace(/[%,()]/g, '')}%`)
          .join(',');

        const { data, error } = await supabase
          .from('products')
          .select(PRODUCT_LIST_FIELDS)
          .or(orFilter)
          .not('product_id', 'in', `(${sortedIds.map((id) => `"${id}"`).join(',')})`)
          .limit(limit);

        if (!error && data) related = data;
      }

      // Fallback: featured / latest products
      if (related.length === 0) {
        const { data } = await supabase
          .from('products')
          .select(PRODUCT_LIST_FIELDS)
          .not('product_id', 'in', `(${sortedIds.map((id) => `"${id}"`).join(',')})`)
          .order('created_at', { ascending: false })
          .limit(limit);
        related = data || [];
      }

      return related;
    },
  });
};
