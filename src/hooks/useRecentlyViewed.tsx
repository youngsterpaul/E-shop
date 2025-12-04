import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'recently_viewed_products';
const MAX_ITEMS = 12;

export interface RecentlyViewedProduct {
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  viewed_at: number;
}

export const useRecentlyViewed = () => {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentlyViewed(parsed);
      } catch (e) {
        console.error('Failed to parse recently viewed products', e);
      }
    }
  }, []);

  // Add a product to recently viewed
  const addToRecentlyViewed = useCallback((product: {
    product_id: string;
    name: string;
    price: number;
    image_urls?: string[] | null;
  }) => {
    setRecentlyViewed(prev => {
      // Remove if already exists
      const filtered = prev.filter(p => p.product_id !== product.product_id);
      
      // Add to beginning
      const newItem: RecentlyViewedProduct = {
        product_id: product.product_id,
        name: product.name,
        price: product.price || 0,
        image_url: product.image_urls?.[0] || '/placeholder.svg',
        viewed_at: Date.now(),
      };
      
      const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
      
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // Clear all recently viewed
  const clearRecentlyViewed = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentlyViewed([]);
  }, []);

  // Remove a single item
  const removeFromRecentlyViewed = useCallback((productId: string) => {
    setRecentlyViewed(prev => {
      const updated = prev.filter(p => p.product_id !== productId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    recentlyViewed,
    addToRecentlyViewed,
    clearRecentlyViewed,
    removeFromRecentlyViewed,
  };
};
