
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';
import { cacheProducts, getCachedProducts } from '@/utils/offlineStorage';
import { useNetworkStatus } from './useNetworkStatus';

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
        // Fall back to cached data if network request fails
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

export const useOptimizedFeaturedProducts = () => {
  const { fetchFeaturedProducts } = useOptimizedProducts();
  
  return useQuery({
    queryKey: ['optimized-featured-products'],
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes
  });
};
