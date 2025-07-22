
import { useCallback, useMemo, useRef } from 'react';
import { debounce } from 'lodash';
import { useCart } from '@/hooks/useCart';

interface PendingUpdate {
  itemId: string;
  quantity: number;
  timestamp: number;
}

export const useDebouncedCartUpdate = (delay: number = 300) => {
  const { updateQuantity } = useCart();
  const pendingUpdatesRef = useRef<Map<string, PendingUpdate>>(new Map());

  const debouncedUpdate = useMemo(
    () => debounce(async (itemId: string, quantity: number) => {
      try {
        await updateQuantity(itemId, quantity);
        pendingUpdatesRef.current.delete(itemId);
      } catch (error) {
        console.error('Failed to update quantity:', error);
        // Remove from pending updates on error
        pendingUpdatesRef.current.delete(itemId);
        throw error;
      }
    }, delay),
    [updateQuantity, delay]
  );

  const updateQuantityDebounced = useCallback((itemId: string, quantity: number) => {
    // Track pending update
    pendingUpdatesRef.current.set(itemId, {
      itemId,
      quantity,
      timestamp: Date.now()
    });

    // Trigger debounced update
    debouncedUpdate(itemId, quantity);
  }, [debouncedUpdate]);

  const cancelPendingUpdate = useCallback((itemId: string) => {
    pendingUpdatesRef.current.delete(itemId);
    debouncedUpdate.cancel();
  }, [debouncedUpdate]);

  const hasPendingUpdate = useCallback((itemId: string) => {
    return pendingUpdatesRef.current.has(itemId);
  }, []);

  const getPendingQuantity = useCallback((itemId: string) => {
    return pendingUpdatesRef.current.get(itemId)?.quantity;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    debouncedUpdate.cancel();
    pendingUpdatesRef.current.clear();
  }, [debouncedUpdate]);

  return {
    updateQuantityDebounced,
    cancelPendingUpdate,
    hasPendingUpdate,
    getPendingQuantity,
    cleanup
  };
};