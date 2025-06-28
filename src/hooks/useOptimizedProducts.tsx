
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/hooks/useProducts';

export const useOptimizedProducts = () => {
  const fetchProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        description,
        image_urls,
        categories,
        stock,
        featured,
        rating,
        specification,
        features
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    })) as Product[];
  };

  const fetchFeaturedProducts = async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        description,
        image_urls,
        categories,
        stock,
        featured,
        rating,
        specification,
        features
      `)
      .eq('featured', true)
      .limit(8);
      
    if (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(error.message);
    }
    
    return data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    })) as Product[];
  };

  const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        product_id,
        name,
        price,
        description,
        image_urls,
        categories,
        stock,
        featured,
        rating,
        specification,
        features
      `)
      .eq('categories', category);
      
    if (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw new Error(error.message);
    }
    
    return data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    })) as Product[];
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
