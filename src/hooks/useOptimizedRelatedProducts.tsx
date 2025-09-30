import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const decodeSafe = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const useOptimizedRelatedProducts = (category: string, currentProductId: string) => {
  return useQuery({
    queryKey: ['related-products', category, currentProductId],
    queryFn: async () => {
      if (!category) return [];

      const safeCategory = decodeSafe(category.trim());

      const { data, error } = await supabase
        .from('products')
        .select('product_id,name,price,image_urls,categories,rating')
        .eq('categories', safeCategory)
        .neq('product_id', currentProductId)
        .limit(12);

      if (error) {
        console.error('Supabase related-products error:', error.message);
        throw error;
      }

      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!category && !!currentProductId,
  });
};
