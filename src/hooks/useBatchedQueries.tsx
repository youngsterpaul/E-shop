import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Batched queries hook to reduce HTTP requests
 * Fetches multiple related data in parallel
 */
export const useBatchedHomeData = () => {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['hero-slides'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('hero_slides')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return data || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: ['categories-main'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('categories')
            .select('id, category, slug, icon_name')
            .is('parent_id', null)
            .order('id', { ascending: true });
          
          if (error) throw error;
          return data || [];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes
      },
      {
        queryKey: ['category-icons'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('category_icons')
            .select('*, category:categories!category_icons_category_id_fkey(id, category, slug), subcategory:categories!category_icons_subcategory_id_fkey(id, category, slug)')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          
          if (error) throw error;
          return data || [];
        },
        staleTime: 10 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
      },
    ],
  });

  return {
    heroSlides: queries[0].data || [],
    categories: queries[1].data || [],
    categoryIcons: queries[2].data || [],
    isLoading: queries.some(q => q.isLoading),
    isError: queries.some(q => q.isError),
    errors: queries.map(q => q.error).filter(Boolean),
  };
};

/**
 * Prefetch critical resources to reduce waterfall requests
 */
export const prefetchCriticalResources = () => {
  // Prefetch images
  const prefetchImage = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  };

  // Prefetch critical API endpoints
  const prefetchData = async () => {
    // Prefetch featured products
    supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .limit(12)
      .order('created_at', { ascending: false });
  };

  return { prefetchImage, prefetchData };
};
