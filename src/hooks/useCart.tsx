import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  variant_selections: any;
  quantity: number;
}

interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: 'active' | 'checkout' | 'completed' | 'abandoned';
  total_amount: number | null;
  item_count: number | null;
  currency: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const subscriptionRef = useRef<any>(null);
  const fetchingRef = useRef(false);

  // Memoize session ID generation
  const getSessionId = useMemo(() => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get or create cart - memoized
  const getOrCreateCart = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: user?.id || undefined,
        p_session_id: user ? undefined : getSessionId
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  }, [user?.id, getSessionId]);

  // Fetch cart and cart items - optimized with debouncing
  const fetchCart = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current && !force) {
      return;
    }

    if (!user && !getSessionId) {
      setLoading(false);
      return;
    }

    fetchingRef.current = true;
    
    try {
      // Get or create cart
      const cartId = await getOrCreateCart();
      if (!cartId) {
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      // Fetch both cart details and items in parallel
      const [cartResponse, itemsResponse] = await Promise.all([
        supabase.from('carts').select('*').eq('id', cartId).single(),
        supabase
          .from('cart_items')
          .select(`
            id,
            cart_id,
            product_id,
            variant_selections,
            quantity,
            products!fk_cart_items_product_id (
              product_id,
              name,
              price,
              image_urls
            )
          `)
          .eq('cart_id', cartId)
      ]);

      if (cartResponse.error) throw cartResponse.error;
      if (itemsResponse.error) throw itemsResponse.error;
      
      const typedCartData: Cart = {
        ...cartResponse.data,
        status: cartResponse.data.status as 'active' | 'checkout' | 'completed' | 'abandoned'
      };
      
      // Only update state if cart changed
      if (!cart || cart.id !== typedCartData.id) {
        setCart(typedCartData);
      }

      const formattedItems = itemsResponse.data?.map(item => ({
        id: item.id,
        cart_id: item.cart_id || '',
        product_id: item.product_id || '',
        product: {
          id: item.products?.product_id || '',
          name: item.products?.name || '',
          price: item.products?.price || 0,
          image: item.products?.image_urls?.[0] || '/placeholder.svg'
        },
        variant_selections: item.variant_selections,
        quantity: item.quantity
      })) || [];

      setCartItems(formattedItems);

      // Set up real-time subscription if not already set up
      if (!subscriptionRef.current && cartId) {
        setupRealtimeSubscription(cartId);
      }
      
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user, getSessionId, getOrCreateCart, toast, cart]);

  // Set up real-time subscription
  const setupRealtimeSubscription = useCallback((cartId: string) => {
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabase
      .channel(`cart_items_${cartId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_id=eq.${cartId}`
        },
        (payload) => {
          console.log('Real-time cart change detected:', payload);
          // Add a small delay to ensure database consistency
          setTimeout(() => {
            fetchCart(true);
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });
  }, [fetchCart]);

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // Optimistic update for immediate UI feedback
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) {
        throw error;
      }
      
      // Force refresh after successful update
      setTimeout(() => {
        fetchCart(true);
      }, 200);
      
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      // Revert optimistic update on error
      await fetchCart(true);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  }, [fetchCart, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    // Optimistic update for immediate UI feedback
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        throw error;
      }
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
      
      // Force refresh after successful removal
      setTimeout(() => {
        fetchCart(true);
      }, 200);
      
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      // Revert optimistic update on error
      await fetchCart(true);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  }, [fetchCart, toast]);

  const addToCart = useCallback(async (productId: string, variantSelections: any = {}, quantity: number = 1) => {
    if (!user && !getSessionId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    console.log('Adding to cart:', { productId, variantSelections, quantity });

    try {
      const cartId = await getOrCreateCart();
      if (!cartId) {
        toast({
          title: "Error",
          description: "Failed to create cart",
          variant: "destructive"
        });
        return;
      }

      console.log('Using cart ID:', cartId);

      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('variant_selections', JSON.stringify(variantSelections))
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      console.log('Existing item:', existingItem);

      if (existingItem) {
        console.log('Updating existing item');
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        console.log('Adding new item');
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            variant_selections: variantSelections,
            quantity: quantity,
            user_id: user?.id || null
          });

        if (insertError) throw insertError;
      }
      
      console.log('Cart operation successful, refreshing...');
      
      // ALWAYS force refresh after add to cart with a delay
      setTimeout(() => {
        console.log('Force refreshing cart...');
        fetchCart(true);
      }, 300);
      
      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });
      
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  }, [user, getSessionId, getOrCreateCart, fetchCart, toast]);

  const clearCart = useCallback(async () => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;
      
      // Force refresh after clearing
      setTimeout(() => {
        fetchCart(true);
      }, 200);
      
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  }, [cart, fetchCart]);

  const updateCartStatus = useCallback(async (status: 'active' | 'checkout' | 'completed' | 'abandoned') => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('carts')
        .update({ status })
        .eq('id', cart.id);

      if (error) throw error;
      setCart({ ...cart, status });
    } catch (error: any) {
      console.error('Error updating cart status:', error);
    }
  }, [cart]);

  // Initial fetch
  useEffect(() => {
    fetchCart();
  }, [user?.id]); // Only depend on user ID changes

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        fetchCart(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchCart, loading]);

  const totalItems = useMemo(() => 
    cartItems.reduce((total, item) => total + item.quantity, 0),
    [cartItems]
  );
  
  const totalPrice = useMemo(() => 
    cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0),
    [cartItems]
  );

  return {
    cart,
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    updateCartStatus,
    totalItems,
    totalPrice,
    refetch: () => fetchCart(true)
  };
};
