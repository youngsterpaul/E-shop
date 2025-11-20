/**
 * @deprecated This hook is consolidated into centralized product queries
 * 
 * Migration guide:
 * - Use useFeaturedProducts from @/hooks/useProducts instead
 * - Use productFetchers from @/queries/productQueries for direct fetching
 * - Offline caching is now handled at the React Query level via persistence
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product, productKeys } from '@/queries/productQueries';
import { cacheProducts, getCachedProducts } from '@/utils/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';

/**
 * Legacy hook - kept for offline support but now uses centralized keys
 * @deprecated Prefer useFeaturedProducts from @/hooks/useProducts
 */
export const useOptimizedProducts = () => {
  const { isOnline } = useNetworkStatus();
  
  const fetchProducts = async (): Promise<Product[]> => {
    // Try to fetch from network if online
    if (isOnline) {
      try {
        const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        image_urls,
        categories,
        stock,
        featured,
        rating
      `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const products = data as Product[];
        
        // Cache products for offline use
        if (products && products.length > 0) {
          await cacheProducts(products);
        }
        
        return products;
      } catch (error) {
        console.error('Error fetching products, falling back to cache:', error);
        return await getCachedProducts();
      }
    }
    
    // Use cached data when offline
    console.log('Offline mode: Using cached products');
    return await getCachedProducts();
  };

  const fetchFeaturedProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        image_urls,
        categories,
        stock,
        featured,
        rating
      `)
      .eq('featured', true)
      .limit(8);
      
    if (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(error.message);
    }
    
    return data as Product[];
  };

  const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        image_urls,
        categories,
        stock,
        featured,
        rating
      `)
      .eq('categories', category);
      
    if (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw new Error(error.message);
    }
    
    return data as Product[];
  };

  return {
    fetchProducts,
    fetchFeaturedProducts,
    fetchProductsByCategory
  };
};

/**
 * @deprecated Use useFeaturedProducts from @/hooks/useProducts instead
 */
export const useOptimizedFeaturedProducts = () => {
  const { fetchFeaturedProducts } = useOptimizedProducts();
  
  return useQuery({
    queryKey: productKeys.featured(8), // Use centralized key
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });
};

