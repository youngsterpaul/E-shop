
import React, { createContext, useContext } from 'react';
import { useCart } from '@/hooks/useCart';

interface CartContextType {
  cart: any;
  cartItems: any[];
  loading: boolean;
  addToCart: (productId: string, variantSelections?: any, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  updateCartStatus: (status: 'active' | 'checkout' | 'completed' | 'abandoned') => Promise<void>;
  totalItems: number;
  totalPrice: number;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const cartData = useCart();

  // Add updateCartItemQuantity as an alias to updateQuantity
  const cartDataWithAlias = {
    ...cartData,
    updateCartItemQuantity: cartData.updateQuantity
  };

  return (
    <CartContext.Provider value={cartDataWithAlias}>
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
