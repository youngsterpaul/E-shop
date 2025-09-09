import { useMemo } from 'react';
import { Product } from './useProducts';
import { FilterState } from '@/components/search/SearchFilters';

export const useProductFiltering = (products: Product[] | undefined, filters: FilterState) => {
  return useMemo(() => {
    if (!products?.length) return [];

    return products.filter(product => {
      // Price filter
      if (product.price) {
        if (product.price < filters.priceRange[0] || product.price > filters.priceRange[1]) {
          return false;
        }
      }

      // Brand filter
      if (filters.brands.length > 0) {
        const productBrand = product.name.match(/^([A-Za-z]+)/)?.[1];
        if (!productBrand || !filters.brands.includes(productBrand)) {
          return false;
        }
      }

      // Specifications filter
      if (Object.keys(filters.specifications).length > 0) {
        let hasMatchingSpec = true;

        for (const [specType, selectedValues] of Object.entries(filters.specifications)) {
          if (selectedValues.length === 0) continue;

          let specMatched = false;

          // Check specification field
          if (product.specification && typeof product.specification === 'object') {
            const specValue = product.specification[specType];
            if (specValue && selectedValues.includes(String(specValue))) {
              specMatched = true;
            }
          }

          // Check product name for specs
          if (!specMatched) {
            const name = product.name;
            
            switch (specType) {
              case 'RAM':
                const ramMatch = name.match(/(\d+)GB RAM/i);
                if (ramMatch && selectedValues.includes(`${ramMatch[1]}GB`)) {
                  specMatched = true;
                }
                break;
              case 'Storage':
                const storageMatch = name.match(/(\d+)GB ROM/i);
                if (storageMatch && selectedValues.includes(`${storageMatch[1]}GB`)) {
                  specMatched = true;
                }
                break;
              case 'Camera':
                const cameraMatch = name.match(/(\d+)MP/i);
                if (cameraMatch && selectedValues.includes(`${cameraMatch[1]}MP`)) {
                  specMatched = true;
                }
                break;
              case 'Battery':
                const batteryMatch = name.match(/(\d+)mAh/i);
                if (batteryMatch && selectedValues.includes(`${batteryMatch[1]}mAh`)) {
                  specMatched = true;
                }
                break;
              case 'Display Size':
                const displayMatch = name.match(/(\d+\.?\d*)".*Display/i);
                if (displayMatch && selectedValues.includes(`${displayMatch[1]}"`)) {
                  specMatched = true;
                }
                break;
            }
          }

          if (!specMatched) {
            hasMatchingSpec = false;
            break;
          }
        }

        if (!hasMatchingSpec) return false;
      }

      // Rating filter
      if (filters.ratings.length > 0) {
        const productRating = product.rating || 4.5; // Default rating
        const hasMatchingRating = filters.ratings.some(minRating => productRating >= minRating);
        if (!hasMatchingRating) return false;
      }

      // Features filter
      if (filters.features.length > 0) {
        let hasMatchingFeature = false;

        // Check features field
        if (product.features) {
          const productFeatures = Array.isArray(product.features) 
            ? product.features 
            : [product.features];
          
          if (productFeatures.some(feature => filters.features.includes(feature))) {
            hasMatchingFeature = true;
          }
        }

        // Check product name for features
        if (!hasMatchingFeature) {
          const name = product.name;
          for (const feature of filters.features) {
            if (
              (feature === '5G' && name.includes('5G')) ||
              (feature === 'AMOLED Display' && name.includes('AMOLED')) ||
              (feature === '120Hz Display' && name.includes('120Hz')) ||
              (feature === 'Fast Charging' && name.includes('Fast Charging'))
            ) {
              hasMatchingFeature = true;
              break;
            }
          }
        }

        if (!hasMatchingFeature) return false;
      }

      return true;
    });
  }, [products, filters]);
};