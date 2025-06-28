
import { useState, useEffect } from 'react';
import { cartService } from '@/services/cartService';
import { useAuth } from '@/hooks/useAuth';

export const useCartManagement = () => {
  const [cartId, setCartId] = useState<string | null>(null);
  const [cartStatus, setCartStatus] = useState<string>('active');
  const { user } = useAuth();

  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  const initializeCart = async () => {
    try {
      const id = await cartService.getOrCreateCart(
        user?.id,
        user ? undefined : getSessionId()
      );
      setCartId(id);
    } catch (error) {
      console.error('Error initializing cart:', error);
    }
  };

  const updateStatus = async (status: 'active' | 'checkout' | 'completed' | 'abandoned') => {
    if (!cartId) return;
    
    try {
      await cartService.updateCartStatus(cartId, status);
      setCartStatus(status);
    } catch (error) {
      console.error('Error updating cart status:', error);
    }
  };

  const clearExpiredCarts = async () => {
    try {
      await cartService.clearExpiredCarts();
    } catch (error) {
      console.error('Error clearing expired carts:', error);
    }
  };

  useEffect(() => {
    initializeCart();
  }, [user]);

  // Clean up expired carts on app load
  useEffect(() => {
    clearExpiredCarts();
  }, []);

  return {
    cartId,
    cartStatus,
    initializeCart,
    updateStatus,
    clearExpiredCarts
  };
};
