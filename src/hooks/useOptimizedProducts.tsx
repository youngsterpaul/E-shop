<<<<<<< HEAD

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
        image_urls,
        categories,
        stock,
        featured,
        rating
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return data as Product[];
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
=======

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
        image_urls,
        categories,
        stock,
        featured,
        rating
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return data as Product[];
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
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
