/**
 * Optimized Related Products Hook
 * Now uses centralized product queries for cache sharing
 */
import { useQuery } from '@tanstack/react-query';
import { productKeys, productFetchers } from '@/queries/productQueries';

const decodeSafe = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const useOptimizedRelatedProducts = (category: string, currentProductId: string) => {
  const safeCategory = category ? decodeSafe(category.trim()) : '';
  
  return useQuery({
    queryKey: productKeys.related(safeCategory, currentProductId),
    queryFn: () => productFetchers.fetchRelatedProducts(safeCategory, currentProductId, 12),
    enabled: !!category && !!currentProductId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
};

