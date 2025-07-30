import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  [key: string]: any;
}

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  product: Product; // Changed from 'items' to 'product'
  variant_selections: any;
  quantity: number;
  added_at: string;
  updated_at: string;
}

interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  status: 'active' | 'checkout' | 'completed' | 'abandoned';
  total_amount: number;
  item_count: number;
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

  // Use ref to persist across renders
  const cartCreationPromiseRef = useRef<Promise<string | null> | null>(null);

  // Safe localStorage access
  const getSessionId = useCallback(() => {
    if (user) return null; // Logged-in users don't need session ID
    
    try {
      let sessionId = localStorage.getItem('cart_session_id');
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('cart_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      console.error('localStorage access failed:', error);
      return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, [user]);

  // Get or create cart - improved logic with cleanup
  const getOrCreateCart = useCallback(async () => {
    try {
      let query = supabase
        .from('carts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // For logged-in users, find by user_id
      if (user) {
        query = query.eq('user_id', user.id).is('session_id', null);
      } else {
        // For guests, find by session_id
        const sessionId = getSessionId();
        if (!sessionId) return null;
        query = query.eq('session_id', sessionId).is('user_id', null);
      }

      const { data: existingCarts, error: queryError } = await query;
      
      if (queryError) throw queryError;

      // If we have existing carts, use the most recent one and clean up duplicates
      if (existingCarts && existingCarts.length > 0) {
        const mostRecentCart = existingCarts[0];
        
        // Clean up duplicate carts if they exist
        if (existingCarts.length > 1) {
          console.warn(`Found ${existingCarts.length} active carts, cleaning up...`);
          
          const cartsToMerge = existingCarts.slice(1);
          
          for (const oldCart of cartsToMerge) {
            // Move items from old cart to the main cart
            await supabase
              .from('cart_items')
              .update({ cart_id: mostRecentCart.id })
              .eq('cart_id', oldCart.id);
            
            // Delete the old cart
            await supabase
              .from('carts')
              .delete()
              .eq('id', oldCart.id);
          }
          
          // Update totals for the merged cart
          await updateCartTotals(mostRecentCart.id);
        }
        
        return mostRecentCart.id;
      }

      // Create new cart only if no existing cart found
      const cartData = {
        user_id: user?.id || null,
        session_id: user ? null : getSessionId(),
        status: 'active' as const,
        total_amount: 0,
        item_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newCart, error } = await supabase
        .from('carts')
        .insert(cartData)
        .select('id')
        .single();

      if (error) throw error;
      return newCart.id;
    } catch (error: any) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  }, [user, getSessionId]);

  // Safe cart creation with race condition protection
  const getOrCreateCartSafe = useCallback(async () => {
    if (cartCreationPromiseRef.current) {
      return await cartCreationPromiseRef.current;
    }
    
    cartCreationPromiseRef.current = getOrCreateCart();
    const result = await cartCreationPromiseRef.current;
    cartCreationPromiseRef.current = null;
    
    return result;
  }, [getOrCreateCart]);

  // Update cart totals using prices from products table
  const updateCartTotals = useCallback(async (cartId: string) => {
    try {
      // Get cart items with product prices from products table
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          product_id,
          products!inner(price)
        `)
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      const itemCount = items?.reduce((total, item) => total + item.quantity, 0) || 0;
      const totalAmount = items?.reduce((total, item) => {
        const price = item.products?.price || 0;
        return total + (price * item.quantity);
      }, 0) || 0;

      // Update cart with calculated totals
      const { error: updateError } = await supabase
        .from('carts')
        .update({ 
          item_count: itemCount,
          total_amount: totalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);

      if (updateError) throw updateError;

      return { item_count: itemCount, total_amount: totalAmount };
    } catch (error) {
      console.error('Error updating cart totals:', error);
      return { item_count: 0, total_amount: 0 };
    }
  }, []);

  // Fetch cart and cart items with product details
  const fetchCart = useCallback(async () => {
    try {
      const cartId = await getOrCreateCartSafe();
      if (!cartId) {
        setLoading(false);
        return;
      }

      // Fetch cart details
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (cartError) throw cartError;
      
      const typedCartData: Cart = {
        ...cartData,
        status: cartData.status as 'active' | 'checkout' | 'completed' | 'abandoned',
        total_amount: cartData.total_amount || 0,
        item_count: cartData.item_count || 0
      };
      setCart(typedCartData);

      // Fetch cart items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          cart_id, 
          product_id, 
          items,
          variant_selections,
          quantity,
          added_at,
          updated_at,
          products!inner(id, name, price, image)
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;

      const formattedItems: CartItem[] = itemsData?.map(item => ({
        id: item.id,
        cart_id: item.cart_id || '',
        product_id: item.product_id || '', 
        product: {
          id: item.products?.id || item.product_id,
          name: item.products?.name || item.items?.name || '',
          price: item.products?.price || 0, // Use price from products table
          image: item.products?.image || item.items?.image || '',
          // Merge any additional data from the stored items field
          ...(item.items || {})
        },
        variant_selections: item.variant_selections,
        quantity: item.quantity,
        added_at: item.added_at || '',
        updated_at: item.updated_at || ''
      })) || [];

      setCartItems(formattedItems);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [getOrCreateCartSafe, toast]);

  // Updated addToCart to match context signature
  const addToCart = useCallback(async (
    productId: string,
    variantSelections: any = {},
    quantity: number = 1,
    itemMetadata?: any
  ) => {
    if (!user && !getSessionId()) {
      toast({
        title: "Session Error",
        description: "Unable to create cart session",
        variant: "destructive"
      });
      return;
    }

    try {
      const cartId = await getOrCreateCartSafe();
      if (!cartId) {
        toast({
          title: "Error",
          description: "Failed to create cart",
          variant: "destructive"
        });
        return;
      }

      // Get product details from database
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, image')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Prepare item data for storage (can include additional metadata)
      const itemData = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        ...itemMetadata // Any additional product metadata
      };

      const now = new Date().toISOString();

      // Check if item already exists in cart with same variants
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

      if (existingItem) {
        // Update existing item quantity
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: now
          })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Add new item to cart
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId, 
            product_id: productId,
            items: itemData, // Store for reference/caching
            variant_selections: variantSelections,
            quantity: quantity,
            added_at: now,
            updated_at: now
          });

        if (insertError) throw insertError;
      }

      // Update cart totals
      await updateCartTotals(cartId);
      
      // Refresh cart data
      await fetchCart();
      
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
  }, [user, getSessionId, getOrCreateCartSafe, updateCartTotals, fetchCart, toast]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    // Optimistic update
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ 
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId);

      if (error) {
        await fetchCart(); // Revert on error
        throw error;
      }

      // Update cart totals
      const totals = await updateCartTotals(item.cart_id);
      
      if (cart) {
        setCart({ ...cart, ...totals });
      }
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  }, [cartItems, cart, updateCartTotals, fetchCart, toast]);

  const removeFromCart = useCallback(async (itemId: string) => {
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    // Optimistic update
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        await fetchCart(); // Revert on error
        throw error;
      }

      // Update cart totals
      const totals = await updateCartTotals(item.cart_id);
      
      if (cart) {
        setCart({ ...cart, ...totals });
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
  }, [cartItems, cart, updateCartTotals, fetchCart, toast]);

  const clearCart = useCallback(async () => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      // Reset cart totals
      const { error: updateError } = await supabase
        .from('carts')
        .update({ 
          item_count: 0,
          total_amount: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      if (updateError) throw updateError;

      await fetchCart();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  }, [cart, fetchCart]);

  const updateCartStatus = useCallback(async (status: 'active' | 'checkout' | 'completed' | 'abandoned') => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('carts')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', cart.id);

      if (error) throw error;
      setCart({ ...cart, status });
    } catch (error: any) {
      console.error('Error updating cart status:', error);
    }
  }, [cart]);

  // Handle cart migration when user logs in
  const migrateGuestCart = useCallback(async () => {
    if (!user) return;

    let sessionId: string | null = null;
    try {
      sessionId = localStorage.getItem('cart_session_id');
    } catch (error) {
      console.error('Failed to access localStorage:', error);
      return;
    }

    if (!sessionId) return;

    try {
      // Find guest cart
      const { data: guestCart } = await supabase
        .from('carts')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .is('user_id', null)
        .maybeSingle();

      if (guestCart) {
        // Check if user already has an active cart
        const { data: userCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .is('session_id', null)
          .maybeSingle();

        if (userCart) {
          // Get guest cart items
          const { data: guestItems } = await supabase
            .from('cart_items')
            .select('*')
            .eq('cart_id', guestCart.id);

          if (guestItems && guestItems.length > 0) {
            // Merge items to user cart, avoiding duplicates
            for (const guestItem of guestItems) {
              // Check if similar item exists in user cart
              const { data: existingUserItem } = await supabase
                .from('cart_items')
                .select('*')
                .eq('cart_id', userCart.id)
                .eq('product_id', guestItem.product_id)
                .eq('variant_selections', JSON.stringify(guestItem.variant_selections))
                .maybeSingle();

              if (existingUserItem) {
                // Update quantity of existing item
                await supabase
                  .from('cart_items')
                  .update({ 
                    quantity: existingUserItem.quantity + guestItem.quantity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', existingUserItem.id);
              } else {
                // Move item to user cart
                await supabase
                  .from('cart_items')
                  .update({ cart_id: userCart.id })
                  .eq('id', guestItem.id);
              }
            }
          }

          // Delete guest cart
          await supabase.from('carts').delete().eq('id', guestCart.id);
          
          // Update user cart totals
          await updateCartTotals(userCart.id);
        } else {
          // Convert guest cart to user cart
          const { error: convertError } = await supabase
            .from('carts')
            .update({ 
              user_id: user.id, 
              session_id: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', guestCart.id);

          if (convertError) throw convertError;
        }

        // Clear session ID
        try {
          localStorage.removeItem('cart_session_id');
        } catch (error) {
          console.error('Failed to clear localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  }, [user, updateCartTotals]);

  useEffect(() => {
    if (user) {
      migrateGuestCart().then(() => fetchCart());
    } else {
      fetchCart();
    }
  }, [user, migrateGuestCart, fetchCart]);

  const totalItems = cart?.item_count || 0;
  const totalPrice = cart?.total_amount || 0;

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
