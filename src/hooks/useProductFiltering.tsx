import { useMemo } from 'react';
import { Product } from './useProducts';
import { FilterState } from '@/components/search/SearchFilters';

export const useProductFiltering = (products: Product[] | undefined, filters: FilterState) => {
  return useMemo(() => {
    if (!products?.length) return [];

    return products.filter(product => {
      // Price filter - early return for performance
      const productPrice = product.price || 0;
      if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
        return false;
      }

      // Specifications filter - skip if no specs selected
      const hasSpecFilters = Object.keys(filters.specifications).length > 0;
      if (hasSpecFilters) {
        for (const [specType, selectedValues] of Object.entries(filters.specifications)) {
          if (selectedValues.length === 0) continue;

          const productSpec = product.specification;
          if (!productSpec || typeof productSpec !== 'object') {
            return false;
          }

          const specValue = productSpec[specType];
          if (!specValue || !selectedValues.includes(String(specValue))) {
            return false;
          }
        }
      }

      // Rating filter - skip if no ratings selected
      if (filters.ratings.length > 0) {
        const productRating = product.rating || 4.5;
        const hasMatchingRating = filters.ratings.some(minRating => productRating >= minRating);
        if (!hasMatchingRating) {
          return false;
        }
      }

      return true;
    });
  }, [products, filters]);
};
