
import { useState, useCallback } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface OptimisticUpdate {
  type: 'quantity' | 'remove';
  itemId: string;
  originalQuantity?: number;
}

export const useOptimisticCart = () => {
  const { updateCartItemQuantity, removeFromCart } = useCartContext();
  const { toast } = useToast();
  const [pendingUpdates, setPendingUpdates] = useState<OptimisticUpdate[]>([]);

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    // Add optimistic update
    setPendingUpdates(prev => [...prev, { type: 'quantity', itemId }]);

    try {
      await updateCartItemQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    } finally {
      // Remove optimistic update
      setPendingUpdates(prev => prev.filter(update => 
        !(update.type === 'quantity' && update.itemId === itemId)
      ));
    }
  }, [updateCartItemQuantity, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    // Add optimistic update
    setPendingUpdates(prev => [...prev, { type: 'remove', itemId }]);

    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    } finally {
      // Remove optimistic update
      setPendingUpdates(prev => prev.filter(update => 
        !(update.type === 'remove' && update.itemId === itemId)
      ));
    }
  }, [removeFromCart, toast]);

  return {
    updateQuantity,
    removeFromCart,
    pendingUpdates
  };
};
