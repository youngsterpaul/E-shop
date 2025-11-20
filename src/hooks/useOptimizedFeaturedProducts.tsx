/**
 * @deprecated This hook is consolidated into useProducts
 * Import useFeaturedProducts from @/hooks/useProducts instead
 */
import { useFeaturedProducts } from './useProducts';

export const useOptimizedFeaturedProducts = (limit?: number) => {
  return useFeaturedProducts(limit || 50);
};
