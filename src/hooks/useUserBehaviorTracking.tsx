import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackProductView,
  trackSearch,
  trackCartAdd,
  trackWishlistAdd,
  trackProductClick,
  trackDwellTime,
  trackSessionStart,
  cleanupOldIntent,
} from '@/utils/userIntent';

/**
 * Hook to automatically track user behavior for personalization
 * Add this to your App.tsx or layout component
 */
export const useUserBehaviorTracking = () => {
  const location = useLocation();
  const dwellStartRef = useRef<{ productId: string; startTime: number } | null>(null);

  // Track session start on mount
  useEffect(() => {
    trackSessionStart();
    cleanupOldIntent();
  }, []);

  // Track page views and extract product/category info from URL
  useEffect(() => {
    const path = location.pathname;
    
    // Track product page views
    if (path.startsWith('/product/')) {
      const parts = path.split('/');
      const productId = parts[parts.length - 1];
      if (productId && productId !== 'product') {
        // Start dwell time tracking
        dwellStartRef.current = { productId, startTime: Date.now() };
        trackProductClick(productId);
      }
    }
    
    // Track category page views
    if (path.startsWith('/category/')) {
      const categorySlug = path.replace('/category/', '');
      if (categorySlug) {
        const categoryName = categorySlug.replace(/-/g, ' ');
        trackProductView('', categoryName);
      }
    }

    // Track search page with query
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('q') || searchParams.get('query');
    if (searchQuery && path.includes('search')) {
      trackSearch(searchQuery);
    }

    // Cleanup: track dwell time when leaving product page
    return () => {
      if (dwellStartRef.current) {
        const elapsed = Math.floor((Date.now() - dwellStartRef.current.startTime) / 1000);
        if (elapsed > 2) { // Only track if user spent more than 2 seconds
          trackDwellTime(dwellStartRef.current.productId, elapsed);
        }
        dwellStartRef.current = null;
      }
    };
  }, [location.pathname, location.search]);

  // Expose tracking functions for manual use
  return {
    trackProductView,
    trackSearch,
    trackCartAdd,
    trackWishlistAdd,
    trackProductClick,
    trackDwellTime,
  };
};

/**
 * Hook specifically for product detail pages
 * Tracks view and dwell time automatically
 */
export const useProductTracking = (
  productId: string | undefined,
  category?: string,
  price?: number
) => {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!productId) return;

    startTimeRef.current = Date.now();
    trackProductView(productId, category, price);

    // Track dwell time on unmount
    return () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (elapsed > 2) {
        trackDwellTime(productId, elapsed);
      }
    };
  }, [productId, category, price]);
};

/**
 * Hook for cart tracking
 */
export const useCartTracking = () => {
  const onAddToCart = useCallback((productId: string, category?: string) => {
    trackCartAdd(productId, category);
  }, []);

  return { onAddToCart };
};

/**
 * Hook for wishlist tracking
 */
export const useWishlistTracking = () => {
  const onAddToWishlist = useCallback((productId: string, category?: string) => {
    trackWishlistAdd(productId, category);
  }, []);

  return { onAddToWishlist };
};

/**
 * Hook for search tracking
 */
export const useSearchTracking = () => {
  const onSearch = useCallback((query: string) => {
    trackSearch(query);
  }, []);

  return { onSearch };
};

export default useUserBehaviorTracking;
