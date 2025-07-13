
import { useState, useEffect, useCallback } from 'react';
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

interface OptimisticUpdate {
  type: 'add' | 'update' | 'remove';
  itemId?: string;
  productId?: string;
  quantity?: number;
  variantSelections?: any;
}

export const useCartWithRetry = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, OptimisticUpdate>>(new Map());
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Exponential backoff retry mechanism
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const exponentialBackoff = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Robust cart fetch with retry logic
  const fetchCartWithRetry = useCallback(async (attempt = 0): Promise<void> => {
    if (attempt > 3) {
      console.error('Max retry attempts reached for cart fetch');
      // Fallback to localStorage cache
      const cachedCart = localStorage.getItem('cart_cache');
      if (cachedCart) {
        try {
          const parsedCart = JSON.parse(cachedCart);
          setCartItems(parsedCart);
          toast({
            title: "Using cached cart",
            description: "Loading cart from cache due to connection issues",
            variant: "default"
          });
        } catch (error) {
          console.error('Error parsing cached cart:', error);
        }
      }
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setRetryCount(attempt);

      // Get or create cart with timeout
      const cartResponse = await Promise.race([
        supabase.rpc('get_or_create_cart', {
          p_user_id: user?.id || undefined,
          p_session_id: user ? undefined : getSessionId()
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cart creation timeout')), 10000)
        )
      ]) as { data: string | null; error: any };

      if (cartResponse.error) throw cartResponse.error;
      if (!cartResponse.data) throw new Error('Failed to get cart ID');

      // Fetch cart items with timeout
      const itemsResponse = await Promise.race([
        supabase
          .from('cart_items')
          .select(`
            id,
            cart_id,
            product_id,
            variant_selections,
            quantity,
            products!inner (
              product_id,
              name,
              price,
              image_urls
            )
          `)
          .eq('cart_id', cartResponse.data),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Cart items fetch timeout')), 10000)
        )
      ]) as { data: any[] | null; error: any };

      if (itemsResponse.error) throw itemsResponse.error;

      const formattedItems = itemsResponse.data?.map(item => ({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        product: {
          id: item.products.product_id,
          name: item.products.name,
          price: item.products.price,
          image: item.products.image_urls?.[0] || '/placeholder.svg'
        },
        variant_selections: item.variant_selections,
        quantity: item.quantity
      })) || [];

      setCartItems(formattedItems);
      
      // Cache successful result
      localStorage.setItem('cart_cache', JSON.stringify(formattedItems));
      localStorage.setItem('cart_cache_timestamp', Date.now().toString());
      
      setRetryCount(0);
      setLoading(false);

    } catch (error: any) {
      console.error(`Cart fetch attempt ${attempt + 1} failed:`, error);
      
      if (attempt < 3) {
        const retryDelay = exponentialBackoff(attempt);
        console.log(`Retrying cart fetch in ${retryDelay}ms...`);
        await delay(retryDelay);
        return fetchCartWithRetry(attempt + 1);
      } else {
        toast({
          title: "Cart loading failed",
          description: "Please check your connection and try refreshing the page",
          variant: "destructive"
        });
        setLoading(false);
      }
    }
  }, [user, getSessionId, toast]);

  // Optimistic add to cart
  const addToCartOptimistic = useCallback(async (productId: string, variantSelections: any = {}, quantity: number = 1) => {
    // Immediate UI update
    const optimisticId = `optimistic_${Date.now()}`;
    setOptimisticUpdates(prev => new Map(prev).set(optimisticId, {
      type: 'add',
      productId,
      quantity,
      variantSelections
    }));

    try {
      // Get product details for optimistic update
      const { data: productData } = await supabase
        .from('products')
        .select('product_id, name, price, image_urls')
        .eq('product_id', productId)
        .single();

      if (productData) {
        const optimisticItem: CartItem = {
          id: optimisticId,
          cart_id: 'optimistic',
          product_id: productId,
          product: {
            id: productData.product_id,
            name: productData.name,
            price: productData.price || 0,
            image: productData.image_urls?.[0] || '/placeholder.svg'
          },
          variant_selections: variantSelections,
          quantity
        };

        setCartItems(prev => [...prev, optimisticItem]);
      }

      // Background server sync
      const cartId = await supabase.rpc('get_or_create_cart', {
        p_user_id: user?.id || undefined,
        p_session_id: user ? undefined : getSessionId()
      });

      if (cartId.data) {
        await supabase.from('cart_items').insert({
          cart_id: cartId.data,
          product_id: productId,
          variant_selections: variantSelections,
          quantity: quantity,
          user_id: user?.id || null
        });

        // Remove optimistic update and refresh
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(optimisticId);
          return newMap;
        });
        
        await fetchCartWithRetry();
      }

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart"
      });

    } catch (error) {
      // Revert optimistic update on error
      setCartItems(prev => prev.filter(item => item.id !== optimisticId));
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(optimisticId);
        return newMap;
      });
      
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  }, [user, getSessionId, fetchCartWithRetry, toast]);

  // Optimistic quantity update
  const updateQuantityOptimistic = useCallback(async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      return removeFromCartOptimistic(itemId);
    }

    // Immediate UI update
    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));

    try {
      await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      // Cache updated cart
      const updatedItems = cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      localStorage.setItem('cart_cache', JSON.stringify(updatedItems));

    } catch (error) {
      // Revert on error
      await fetchCartWithRetry();
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  }, [cartItems, fetchCartWithRetry, toast]);

  // Optimistic remove from cart
  const removeFromCartOptimistic = useCallback(async (itemId: string) => {
    // Store item for potential revert
    const itemToRemove = cartItems.find(item => item.id === itemId);
    
    // Immediate UI update
    setCartItems(prev => prev.filter(item => item.id !== itemId));

    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      // Cache updated cart
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      localStorage.setItem('cart_cache', JSON.stringify(updatedItems));

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });

    } catch (error) {
      // Revert on error
      if (itemToRemove) {
        setCartItems(prev => [...prev, itemToRemove]);
      }
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  }, [cartItems, toast]);

  useEffect(() => {
    fetchCartWithRetry();
  }, [fetchCartWithRetry]);

  // Check for cached cart on load
  useEffect(() => {
    const cachedCart = localStorage.getItem('cart_cache');
    const cacheTimestamp = localStorage.getItem('cart_cache_timestamp');
    
    if (cachedCart && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      // Use cache if less than 5 minutes old
      if (cacheAge < 5 * 60 * 1000) {
        try {
          const parsedCart = JSON.parse(cachedCart);
          setCartItems(parsedCart);
        } catch (error) {
          console.error('Error parsing cached cart:', error);
        }
      }
    }
  }, []);

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return {
    cartItems,
    loading,
    retryCount,
    addToCart: addToCartOptimistic,
    updateQuantity: updateQuantityOptimistic,
    removeFromCart: removeFromCartOptimistic,
    totalItems,
    totalPrice,
    refetch: fetchCartWithRetry,
    clearCart: async () => {
      setCartItems([]);
      localStorage.removeItem('cart_cache');
    }
  };
};
