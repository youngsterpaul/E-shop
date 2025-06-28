
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cartService } from '@/services/cartService';

interface CartItem {
  id: string;
  product_id: string;
  cart_id: string;
  quantity: number;
  variant_selections?: any;
  products: {
    product_id: string;
    name: string;
    price: number;
    image_urls: string[];
  };
}

export const useOptimizedCart = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sessionId] = useState(() => 
    localStorage.getItem('cart_session_id') || 
    crypto.randomUUID()
  );

  useEffect(() => {
    if (!localStorage.getItem('cart_session_id')) {
      localStorage.setItem('cart_session_id', sessionId);
    }
  }, [sessionId]);

  const fetchCartItems = async (): Promise<CartItem[]> => {
    const cartId = await cartService.getOrCreateCart(user?.id, sessionId);
    if (!cartId) return [];

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        cart_id,
        quantity,
        variant_selections,
        products!cart_items_product_id_fkey (
          product_id,
          name,
          price,
          image_urls
        )
      `)
      .eq('cart_id', cartId);

    if (error) {
      console.error('Error fetching cart items:', error);
      return [];
    }

    return data as CartItem[];
  };

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['optimized-cart', user?.id, sessionId],
    queryFn: fetchCartItems,
    staleTime: 30 * 1000, // Cache for 30 seconds
    gcTime: 2 * 60 * 1000 // Keep in cache for 2 minutes
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const cartId = await cartService.getOrCreateCart(user?.id, sessionId);
      if (!cartId) throw new Error('Failed to create cart');

      const { data, error } = await supabase
        .from('cart_items')
        .upsert({
          cart_id: cartId,
          product_id: productId,
          quantity,
          user_id: user?.id
        }, {
          onConflict: 'cart_id,product_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-cart'] });
    }
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-cart'] });
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        return removeFromCartMutation.mutateAsync(itemId);
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimized-cart'] });
    }
  });

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => 
      total + (item.products.price * item.quantity), 0
    );
  };

  return {
    cartItems,
    loading: isLoading,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    getTotalItems,
    getTotalPrice,
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending || removeFromCartMutation.isPending
  };
};
