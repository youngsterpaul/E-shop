import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedFeaturedProducts = () => {
  return useQuery({
    queryKey: ['featured-products-optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          price,
          image_urls,
          categories,
          rating,
          featured
        `)
        .eq('featured', true)
        .limit(50); // Limit to reasonable amount
        
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    gcTime: 30 * 60 * 1000 // Keep in cache for 30 minutes
  });
};