
// Create a new hook: hooks/useAutoRefreshCart.js
import { useEffect, useRef } from 'react';
import { useCart } from '@/hooks/useCart';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';

export const useAutoRefreshCart = (intervalMs = 2000) => {
  const { refetch } = useCart();
  const { forceRecalculate } = useSelectiveCart();
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(true);

  // Track if the page is visible to avoid unnecessary requests
  useEffect(() => {
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Auto refresh cart data
  useEffect(() => {
    const autoRefresh = async () => {
      if (!isActiveRef.current) return; // Skip if page is not visible
      
      try {
        await refetch();
        forceRecalculate();
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    };

    // Set up interval
    intervalRef.current = setInterval(autoRefresh, intervalMs);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetch, forceRecalculate, intervalMs]);

  // Manual refresh function
  const manualRefresh = async () => {
    try {
      await refetch();
      forceRecalculate();
    } catch (error) {
      console.error('Manual refresh error:', error);
    }
  };

  return { manualRefresh };
};