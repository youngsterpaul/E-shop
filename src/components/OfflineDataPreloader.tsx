import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cacheProducts, cacheCategories, getCacheStats } from '@/utils/offlineStorage';

/**
 * OfflineDataPreloader
 * 
 * This component preloads essential data for offline access when the user is online.
 * It runs once on mount and caches products and categories to IndexedDB.
 */
export const OfflineDataPreloader = () => {
  const hasPreloaded = useRef(false);

  useEffect(() => {
    const preloadData = async () => {
      // Only run once and only when online
      if (hasPreloaded.current || !navigator.onLine) return;
      hasPreloaded.current = true;

      try {
        // Check current cache stats
        const stats = await getCacheStats();
        console.log('Current offline cache stats:', stats);

        // If we already have cached products, skip preloading
        if (stats.products > 20) {
          console.log('Offline cache already populated, skipping preload');
          return;
        }

        console.log('Preloading data for offline access...');

        // Fetch and cache products (limit to 100 most recent for initial cache)
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (!productsError && products) {
          await cacheProducts(products);
          console.log(`Cached ${products.length} products for offline use`);
        }

        // Fetch and cache all categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id, category, parent_id');

        if (!categoriesError && categories) {
          await cacheCategories(categories);
          console.log(`Cached ${categories.length} categories for offline use`);
        }

        // Log final stats
        const finalStats = await getCacheStats();
        console.log('Offline cache preload complete:', finalStats);
      } catch (error) {
        console.warn('Failed to preload offline data:', error);
      }
    };

    // Delay preload slightly to not block initial render
    const timer = setTimeout(preloadData, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
};
