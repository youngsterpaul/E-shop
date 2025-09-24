import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Product = {
  reviews: number;
  discount_price: number;
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

export const PAGINATION_CONFIG = {
  DESKTOP_PAGE_SIZE: 24,
  MOBILE_PAGE_SIZE: 12,
  FEATURED_LIMIT: 100,
};

/** --- Helpers --- */
const processProducts = (products: any[]): Product[] =>
  products.map((p) => ({
    ...p,
    specification:
      typeof p.specification === 'string' && p.specification
        ? (() => {
            try {
              return JSON.parse(p.specification);
            } catch (err) {
              console.error('Failed to parse specification JSON:', err);
              return {};
            }
          })()
        : p.specification || {},
  }));

/** Generic fetch with pagination + error safety */
async function fetchPage(
  query: ReturnType<typeof supabase.from>,
  { pageParam = 0, pageSize = PAGINATION_CONFIG.DESKTOP_PAGE_SIZE } = {}
) {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to).order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase fetch error:', error);
    throw new Error(error.message);
  }

  return {
    products: processProducts(data || []),
    totalCount: count || 0,
    hasNextPage: (count || 0) > from + (data?.length || 0),
    nextPage: (count || 0) > from + (data?.length || 0) ? pageParam + 1 : undefined,
  };
}

/** --- Main hook factory --- */
export const useProducts = () => {
  const queryClient = useQueryClient();

  const fetchProducts = async (opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(supabase.from('products').select('*', { count: 'exact' }), opts);

  const fetchProductById = async (id: string) => {
    const { data, error } = await supabase.from('products').select('*').eq('product_id', id).maybeSingle();
    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error(error.message);
    }
    return data ? processProducts([data])[0] : null;
  };

  const fetchFeaturedProducts = async (opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(supabase.from('products').select('*', { count: 'exact' }).eq('featured', true), opts);

  const fetchProductsByCategory = async (
    category: string,
    opts?: { pageParam?: number; pageSize?: number }
  ) =>
    fetchPage(
      supabase.from('products').select('*', { count: 'exact' }).eq('categories', category),
      opts
    );

  const searchProducts = async (query: string, opts?: { pageParam?: number; pageSize?: number }) => {
    const search = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,categories.ilike.%${query}%`);
    return fetchPage(search, opts);
  };

  return {
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    fetchProductsByCategory,
    searchProducts,
  };
};

/** --- React Query hooks --- */
export const useFeaturedProducts = (pageSize?: number) => {
  const { fetchFeaturedProducts } = useProducts();
  return useInfiniteQuery({
    queryKey: ['featuredProducts', pageSize],
    queryFn: ({ pageParam }) => fetchFeaturedProducts({ pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false,
    }),
  });
};

export const useProduct = (id: string) => {
  const { fetchProductById } = useProducts();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductSearch = (query: string, pageSize?: number) => {
  const { searchProducts } = useProducts();
  return useInfiniteQuery({
    queryKey: ['productSearch', query, pageSize],
    queryFn: ({ pageParam }) => searchProducts(query, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: query.length > 1,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false,
    }),
  });
};

export const useProductsByCategory = (category: string, pageSize?: number) => {
  const { fetchProductsByCategory } = useProducts();
  return useInfiniteQuery({
    queryKey: ['productsByCategory', category, pageSize],
    queryFn: ({ pageParam }) => fetchProductsByCategory(category, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!category,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages[data.pages.length - 1]?.hasNextPage || false,
    }),
  });
};

/** Keep backward compatibility */
export const useProductByName = (productName: string) =>
  useQuery({
    queryKey: ['product', 'name', productName],
    queryFn: () => fetchProductByName(productName),
    enabled: !!productName,
    staleTime: 5 * 60 * 1000,
  });

export const fetchProductByName = async (productName: string): Promise<Product | null> => {
  const searchName = productName.replace(/-/g, ' ');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${searchName}%`)
    .maybeSingle();

  if (error) {
    console.error('Error fetching product by name:', error);
    throw new Error(error.message);
  }
  return data ? processProducts([data])[0] : null;
};
