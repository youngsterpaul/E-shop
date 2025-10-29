import { useMemo } from 'react';
import { Product } from './useProducts';
import { FilterState } from '@/components/search/SearchFilters';

export const useProductFiltering = (products: Product[] | undefined, filters: FilterState) => {
  return useMemo(() => {
    if (!products?.length) return [];

    // Early return if no filters are active
    const hasSpecFilters = Object.values(filters.specifications).some(arr => arr.length > 0);
    const hasRatingFilters = filters.ratings.length > 0;
    const hasPriceFilter = filters.priceRange[0] > 0 || filters.priceRange[1] < 200000;

    if (!hasSpecFilters && !hasRatingFilters && !hasPriceFilter) {
      return products;
    }

    return products.filter(product => {
      // Price filter - most common, check first for performance
      if (hasPriceFilter) {
        const productPrice = product.price || 0;
        if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
          return false;
        }
      }

      // Specifications filter
      if (hasSpecFilters) {
        const productSpec = product.specification;
        if (!productSpec || typeof productSpec !== 'object') {
          return false;
        }

        for (const [specType, selectedValues] of Object.entries(filters.specifications)) {
          if (selectedValues.length === 0) continue;

          const specValue = productSpec[specType];
          if (!specValue || !selectedValues.includes(String(specValue))) {
            return false;
          }
        }
      }

      // Rating filter
      if (hasRatingFilters) {
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