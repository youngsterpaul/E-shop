import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  productKeys, 
  productFetchers, 
  Product, 
  PaginatedProducts,
  PAGINATION_CONFIG 
} from '@/queries/productQueries';

/** Re-export types for backward compatibility */
export type { Product, PaginatedProducts };
export { PAGINATION_CONFIG };

/**
 * Legacy hook factory - now delegates to centralized productFetchers
 * @deprecated Use productFetchers directly from @/queries/productQueries
 */
export const useProducts = () => productFetchers;

/** 
 * React Query Hooks - All use centralized query keys for cache sharing
 */

export const useFeaturedProducts = (pageSize?: number) => {
  return useInfiniteQuery({
    queryKey: productKeys.featured(pageSize),
    queryFn: ({ pageParam }) => productFetchers.fetchFeaturedProducts({ pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productFetchers.fetchProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProductsByCategory = (category: string, pageSize?: number) => {
  return useInfiniteQuery({
    queryKey: productKeys.category(category, pageSize),
    queryFn: ({ pageParam }) => productFetchers.fetchProductsByCategory(category, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!category,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useProductSearch = (query: string, pageSize?: number) => {
  return useInfiniteQuery({
    queryKey: productKeys.search(query, pageSize),
    queryFn: ({ pageParam }) => productFetchers.searchProducts(query, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: query.trim().length > 1,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
    staleTime: 2 * 60 * 1000, // Shorter cache for search
    gcTime: 5 * 60 * 1000,
  });
};

export const useProductByName = (productName: string) => {
  return useQuery({
    queryKey: ['product', 'name', productName],
    queryFn: () => productFetchers.fetchProductByName(productName),
    enabled: !!productName,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};
