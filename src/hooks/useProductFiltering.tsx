import { useMemo } from 'react';
import { FilterState } from '@/components/search/SearchFilters';
import { Product } from '@/queries/productQueries';
import { normalizeSpecValue } from '@/utils/specNormalize';

/**
 * Filters products client-side based on the active FilterState.
 * Spec key comparison is case-insensitive so "Brand" matches filter key "brand".
 */
export function useProductFiltering(products: Product[], filters: FilterState): Product[] {
  return useMemo(() => {
    if (!products?.length) return [];

    return products.filter(product => {
      // ── Price filter ──────────────────────────────────────────────────────
      const [minPrice, maxPrice] = filters.priceRange;
      if (product.price < minPrice || product.price > maxPrice) return false;

      // ── Rating filter ─────────────────────────────────────────────────────
      if (filters.ratings.length > 0) {
        const productRating = Math.floor(product.rating ?? 0);
        if (!filters.ratings.includes(productRating)) return false;
      }

      // ── Specification filters ─────────────────────────────────────────────
      const activeSpecs = Object.entries(filters.specifications).filter(
        ([, values]) => values.length > 0
      );

      if (activeSpecs.length > 0) {
        const spec = product.specification;

        // Build a normalized lookup map once per product: { "brand": "HP", ... }
        const normalizedSpec: Record<string, string> = {};
        if (product.specification && typeof product.specification === 'object' && !Array.isArray(product.specification)) {
          for (const [k, v] of Object.entries(product.specification)) {
            if (typeof v === 'string') {
              const key = k.toLowerCase().trim();
              normalizedSpec[key] = normalizeSpecValue(key, v);
            }
          }
        }

        for (const [filterKey, selectedValues] of activeSpecs) {
          const productValue = normalizedSpec[filterKey.toLowerCase().trim()];
          // Product must match at least one of the selected values for this spec
          if (!productValue || !selectedValues.includes(productValue)) return false;
        }
      }

      return true;
    });
  }, [products, filters]);
}