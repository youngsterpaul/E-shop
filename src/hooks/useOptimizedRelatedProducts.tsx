import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedRelatedProducts = (category: string, currentProductId: string) => {
  return useQuery({
    queryKey: ['related-products', category, currentProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          price,
          image_urls,
          categories,
          rating
        `)
        .eq('categories', category)
        .neq('product_id', currentProductId)
        .limit(12);
        
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: !!category && !!currentProductId
  });
};