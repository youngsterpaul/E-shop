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
  
  // Use refs to prevent multiple operations and track state
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Stable session ID generation
  const getSessionId = useCallback(() => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  }, []);

  // Get existing cart without creating
  const getExistingCart = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('carts')
        .select('*')
        .eq(user?.id ? 'user_id' : 'session_id', user?.id || getSessionId())
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting existing cart:', error);
      return null;
    }
  }, [user?.id, getSessionId]);

  // Create cart only when needed (when adding items)
  const createCartForItem = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: user?.id || undefined,
        p_session_id: user ? undefined : getSessionId()
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating cart:', error);
      return null;
    }
  }, [user?.id, getSessionId]);

  // Fetch cart items - stable function that doesn't change
  const fetchCartItems = useCallback(async (cartId: string) => {
    try {
      const itemsResponse = await supabase
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
        .eq('cart_id', cartId);

      if (itemsResponse.error) throw itemsResponse.error;

      // Fetch variants for all products to calculate correct prices
      const productIds = itemsResponse.data?.map(item => item.product_id).filter(Boolean) || [];
      const variantsResponse = productIds.length > 0 ? await supabase
        .from('product_variants')
        .select('product_id, variant_type, variant_value, price_modifier, image_url')
        .in('product_id', productIds) : { data: [] };

      const variantsByProduct = new Map();
      variantsResponse.data?.forEach(variant => {
        if (!variantsByProduct.has(variant.product_id)) {
          variantsByProduct.set(variant.product_id, []);
        }
        variantsByProduct.get(variant.product_id).push(variant);
      });

      const formattedItems = itemsResponse.data?.map(item => {
        const basePrice = item.products?.price || 0;
        const variants = variantsByProduct.get(item.product_id) || [];
        
        // Calculate price with variant modifiers
        let finalPrice = basePrice;
        const variantSelections = item.variant_selections || {};
        
        Object.entries(variantSelections).forEach(([type, value]) => {
          const variant = variants.find(v => 
            v.variant_type === type && v.variant_value === value
          );
          if (variant?.price_modifier) {
            finalPrice += variant.price_modifier;
          }
        });

        // Get variant image if available
        let variantImage = item.products?.image_urls?.[0] || '/placeholder.svg';
        Object.entries(variantSelections).forEach(([type, value]) => {
          const variant = variants.find(v => 
            v.variant_type === type && v.variant_value === value
          );
          if (variant?.image_url) {
            variantImage = variant.image_url;
          }
        });

        return {
          id: item.id,
          cart_id: item.cart_id || '',
          product_id: item.product_id || '',
          product: {
            id: item.products?.product_id || '',
            name: item.products?.name || '',
            price: finalPrice, // Use calculated price with variant modifiers
            image: variantImage
          },
          variant_selections: variantSelections,
          quantity: item.quantity
        };
      }) || [];

      setCartItems(formattedItems);
      return formattedItems;
    } catch (error: any) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
  }, []);

  // Fetch existing cart and items - no auto-creation
  const fetchCart = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return;
    }

    if (!user && !getSessionId()) {
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    
    try {
      // Only get existing cart, don't create
      const existingCart = await getExistingCart();
      if (!existingCart) {
        // No cart exists, set empty state
        setCart(null);
        setCartItems([]);
        setLoading(false);
        return;
      }

      // Fetch cart items
      await fetchCartItems(existingCart.id);
      
      const typedCartData: Cart = {
        ...existingCart,
        status: existingCart.status as 'active' | 'checkout' | 'completed' | 'abandoned',
        currency: 'KES'
      };
      
      setCart(typedCartData);

    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user, getSessionId, getExistingCart, fetchCartItems, toast]);

  // Set up real-time subscription - FIXED VERSION
  useEffect(() => {
    // Only set up subscription if we have a cart and haven't subscribed yet
    if (!cart?.id || isSubscribedRef.current) {
      return;
    }

    let retryTimeout: NodeJS.Timeout;
    
    const setupSubscription = () => {
      const channel = supabase
        .channel(`cart-changes-${cart.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `cart_id=eq.${cart.id}`
          },
          (payload) => {
            // Debounce rapid changes
            setTimeout(() => {
              fetchCartItems(cart.id).catch(console.error);
            }, 100);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            isSubscribedRef.current = false;
            // Retry subscription after 2 seconds on error
            if (cart?.id) {
              retryTimeout = setTimeout(() => {
                if (subscriptionRef.current) {
                  supabase.removeChannel(subscriptionRef.current);
                }
                setupSubscription();
              }, 2000);
            }
          }
        });

      subscriptionRef.current = channel;
    };

    setupSubscription();

    // Cleanup function
    return () => {
      clearTimeout(retryTimeout);
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [cart?.id, fetchCartItems]);

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
        // Revert optimistic update on error
        if (cart?.id) {
          await fetchCartItems(cart.id);
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error", 
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  }, [cart?.id, fetchCartItems, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    // Optimistic update for immediate UI feedback
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        // Revert optimistic update on error
        if (cart?.id) {
          await fetchCartItems(cart.id);
        }
        throw error;
      }

      // If no items left, delete the cart
      if (updatedItems.length === 0 && cart?.id) {
        await supabase.from('carts').delete().eq('id', cart.id);
        setCart(null);
      }
      
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart"
      });
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive"
      });
    }
  }, [cart?.id, cartItems, fetchCartItems, toast]);

  const addToCart = useCallback(async (productId: string, variantSelections: any = {}, quantity: number = 1) => {
    if (!user && !getSessionId()) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get existing cart or create new one only when adding items
      let cartId = cart?.id;
      if (!cartId) {
        const newCartId = await createCartForItem();
        if (!newCartId) {
          toast({
            title: "Error",
            description: "Failed to create cart",
            variant: "destructive"
          });
          return;
        }
        cartId = newCartId;
      }

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

      let result;
      if (existingItem) {
        result = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);
      } else {
        result = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            variant_selections: variantSelections,
            quantity: quantity,
            user_id: user?.id || null
          });
      }

      if (result.error) throw result.error;

      // If this was the first item and we didn't have a cart, refetch to get the new cart
      if (!cart?.id) {
        await fetchCart();
      }
      
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
  }, [user, getSessionId, createCartForItem, cart?.id, fetchCart, toast]);

  const clearCart = useCallback(async () => {
    if (!cart) return;

    try {
      // Delete all cart items
      const { error: itemsError } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (itemsError) throw itemsError;

      // Delete the cart itself
      const { error: cartError } = await supabase
        .from('carts')
        .delete()
        .eq('id', cart.id);

      if (cartError) throw cartError;

      // Clear local state
      setCart(null);
      setCartItems([]);
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  }, [cart]);

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

  // Initial fetch and auth migration - FIXED VERSION
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      return;
    }
    
    isInitializedRef.current = true;
    
    const initializeCart = async () => {
      // Auto-migrate guest cart when user is authenticated
      if (user && getSessionId()) {
        try {
          const { data, error } = await supabase.rpc('migrate_guest_cart_to_user', {
            p_user_id: user.id,
            p_session_id: getSessionId()
          });
          
          if (error) {
            console.error('Cart migration error:', error);
          } else if (data) {
            // Wait a moment for migration to complete
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
      
      // Fetch cart after potential migration
      await fetchCart();
    };

    initializeCart();
  }, [user, fetchCart, getSessionId]);

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
    refetch: fetchCart
  };
};
