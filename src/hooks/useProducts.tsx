import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Product = {
  product_id: string;
  name: string;
  price: number;
  description?: string;
  image_urls?: string[];
  category_id?: string;
  categories?: string;
  subcategories?: string;
  stock?: number;
  featured?: boolean;
  specification?: string | Record<string, any>;
  features?: string | string[];
  rating?: number;
};

// Constants for pagination
export const PAGINATION_CONFIG = {
  DESKTOP_PAGE_SIZE: 24,
  MOBILE_PAGE_SIZE: 8,
  FEATURED_LIMIT: 100, // Reasonable limit for featured products
};

// Helper function to process products
const processProducts = (products: any[]): Product[] => {
  return products.map(product => ({
    ...product,
    specification: typeof product.specification === 'string' && product.specification
      ? (() => {
          try {
            return JSON.parse(product.specification);
          } catch (e) {
            console.error('Failed to parse specification JSON:', e);
            return {};
          }
        })()
      : product.specification || {}
  }));
};

export const useProducts = () => {
  const queryClient = useQueryClient();

  const fetchProducts = async ({ pageParam = 0, pageSize = 24 } = {}) => {
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    return {
      products: processProducts(data || []),
      totalCount: count || 0,
      hasNextPage: (count || 0) > (from + (data?.length || 0)),
      nextPage: (count || 0) > (from + (data?.length || 0)) ? pageParam + 1 : undefined
    };
  };
  
  const fetchProductById = async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', id)
      .maybeSingle();
      
    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error(error.message);
    }

    if (!data) return null;

    return processProducts([data])[0];
  };
  
  const fetchFeaturedProducts = async ({ pageParam = 0, pageSize = 24 } = {}) => {
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('featured', true)
      .range(from, to)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(error.message);
    }
    
    return {
      products: processProducts(data || []),
      totalCount: count || 0,
      hasNextPage: (count || 0) > (from + (data?.length || 0)),
      nextPage: (count || 0) > (from + (data?.length || 0)) ? pageParam + 1 : undefined
    };
  };
  
  const fetchProductsByCategory = async (category: string, { pageParam = 0, pageSize = 24 } = {}) => {
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('categories', category)
      .range(from, to)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw new Error(error.message);
    }
    
    return {
      products: processProducts(data || []),
      totalCount: count || 0,
      hasNextPage: (count || 0) > (from + (data?.length || 0)),
      nextPage: (count || 0) > (from + (data?.length || 0)) ? pageParam + 1 : undefined
    };
  };
  
  const searchProducts = async (query: string, { pageParam = 0, pageSize = 24 } = {}) => {
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,categories.ilike.%${query}%`)
      .range(from, to)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error(`Error searching products with query ${query}:`, error);
      throw new Error(error.message);
    }
    
    return {
      products: processProducts(data || []),
      totalCount: count || 0,
      hasNextPage: (count || 0) > (from + (data?.length || 0)),
      nextPage: (count || 0) > (from + (data?.length || 0)) ? pageParam + 1 : undefined
    };
  };

  return {
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    fetchProductsByCategory,
    searchProducts
  };
};

// Hook for infinite scrolling featured products
export const useFeaturedProducts = (pageSize?: number) => {
  const { fetchFeaturedProducts } = useProducts();
  
  return useInfiniteQuery({
    queryKey: ['featuredProducts', pageSize],
    queryFn: ({ pageParam }) => fetchFeaturedProducts({ pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      products: data.pages.flatMap(page => page.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false
    }),
  });
};

// Hook for single product
export const useProduct = (id: string) => {
  const { fetchProductById } = useProducts();
  
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for product search with infinite scroll
export const useProductSearch = (query: string, pageSize?: number) => {
  const { searchProducts } = useProducts();
  
  return useInfiniteQuery({
    queryKey: ['productSearch', query, pageSize],
    queryFn: ({ pageParam }) => searchProducts(query, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: query.length > 1,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      products: data.pages.flatMap(page => page.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false
    }),
  });
};

// Hook for products by category with infinite scroll
export const useProductsByCategory = (category: string, pageSize?: number) => {
  const { fetchProductsByCategory } = useProducts();
  
  return useInfiniteQuery({
    queryKey: ['productsByCategory', category, pageSize],
    queryFn: ({ pageParam }) => fetchProductsByCategory(category, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!category,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      products: data.pages.flatMap(page => page.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false
    }),
  });
};

// Simple hook for product by name (keeping for backward compatibility)
export const useProductByName = (productName: string) => {
  return useQuery({
    queryKey: ["product", "name", productName],
    queryFn: () => fetchProductByName(productName),
    enabled: !!productName,
    staleTime: 5 * 60 * 1000,
  });
};

export const fetchProductByName = async (productName: string): Promise<Product | null> => {
  const searchName = productName.replace(/-/g, ' ');
  
  const { data, error } = await supabase
    .from("products")
    .select('*')
    .ilike("name", `%${searchName}%`)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product by name:', error);
    throw new Error(error.message);
  }

  return data ? processProducts([data])[0] : null;
};
