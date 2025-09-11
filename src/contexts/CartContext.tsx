
import React, { createContext, useContext, useMemo } from 'react';
import { useCart } from '@/hooks/useCart';

interface CartContextType {
  cart: any;
  cartItems: any[];
  loading: boolean;
  addToCart: (productId: string, variantSelections?: any, quantity?: number, itemMetadata?: any) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateCartStatus: (status: 'active' | 'checkout' | 'completed' | 'abandoned') => Promise<void>;
  totalItems: number;
  totalPrice: number;
  refetch: () => Promise<void>;
  // Helper methods
  getCartItemById: (itemId: string) => any | null;
  isCartEmpty: boolean;
  hasItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartData = useCart();

  // Memoize enhanced cart data to prevent unnecessary re-renders
  const enhancedCartData = useMemo(() => {
    const getCartItemById = (itemId: string) => 
      cartData.cartItems.find(item => item.id === itemId) || null;
    
    const isCartEmpty = cartData.cartItems.length === 0;
    const hasItems = cartData.cartItems.length > 0;

    return {
      ...cartData,
      getCartItemById,
      isCartEmpty,
      hasItems,
      // Force re-render when cart items change
      _cartItemsLength: cartData.cartItems.length,
      _lastUpdate: Date.now()
    };
  }, [cartData, cartData.cartItems, cartData.cartItems.length]);

  return (
    <CartContext.Provider value={enhancedCartData}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};