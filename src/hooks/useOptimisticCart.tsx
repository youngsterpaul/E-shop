
import { useState, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

export const useOptimisticCart = () => {
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, number>>(new Map());
  const { cartItems, updateQuantity: originalUpdateQuantity, removeFromCart: originalRemoveFromCart } = useCart();
  const { toast } = useToast();

  const updateQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    // Optimistic update
    setOptimisticUpdates(prev => new Map(prev).set(itemId, newQuantity));

    try {
      await originalUpdateQuantity(itemId, newQuantity);
      // Remove optimistic update on success
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive"
      });
    }
  }, [originalUpdateQuantity, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    // Optimistic update - mark as removed
    setOptimisticUpdates(prev => new Map(prev).set(itemId, 0));

    try {
      await originalRemoveFromCart(itemId);
      // Remove from optimistic updates on success
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      
      toast({
        title: "Error",
        description: "Failed to remove item. Please try again.",
        variant: "destructive"
      });
    }
  }, [originalRemoveFromCart, toast]);

  // Merge cart items with optimistic updates
  const optimisticCartItems = cartItems.map(item => {
    const optimisticQuantity = optimisticUpdates.get(item.id);
    if (optimisticQuantity !== undefined) {
      return { ...item, quantity: optimisticQuantity };
    }
    return item;
  }).filter(item => item.quantity > 0);

  return {
    cartItems: optimisticCartItems,
    updateQuantity,
    removeFromCart,
  };
};
