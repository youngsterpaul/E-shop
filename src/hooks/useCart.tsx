import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
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

  // Generate session ID for guest users only
  const getSessionId = () => {
    if (user) return null;
    
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  // Get or create cart using SQL function
  const getOrCreateCart = async () => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: user?.id || null,
        p_session_id: user ? null : getSessionId()
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }
      
      console.log('Cart ID from RPC:', data);
      return data;
    } catch (error: any) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  };

  // Fetch cart and cart items
  const fetchCart = async () => {
    try {
      // Get or create cart
      const cartId = await getOrCreateCart();
      if (!cartId) {
        setLoading(false);
        return;
      }

      console.log('Fetching cart data for ID:', cartId);

      // Fetch cart details
      const { data: cartData, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (cartError) {
        console.error('Cart fetch error:', cartError);
        throw cartError;
      }
      
      console.log('Cart data:', cartData);
      
      const typedCartData: Cart = {
        ...cartData,
        status: cartData.status as 'active' | 'checkout' | 'completed' | 'abandoned',
        total_amount: Number(cartData.total_amount) || 0,
        item_count: cartData.item_count || 0
      };
      setCart(typedCartData);

      // Fetch cart items (without items field)
      const { data: itemsData, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          id,
          cart_id, 
          product_id, 
          variant_selections,
          quantity,
          added_at,
          updated_at
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false });

      if (itemsError) {
        console.error('Items fetch error:', itemsError);
        throw itemsError;
      }

      console.log('Cart items data:', itemsData);

      const formattedItems: CartItem[] = itemsData?.map(item => ({
        id: item.id,
        cart_id: item.cart_id || '',
        product_id: item.product_id || '', 
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
  };

  const addToCart = async (
    product_id: string,
    variantSelections: any = {}, 
    quantity: number = 1
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
      console.log('Adding to cart:', { product_id, variantSelections, quantity });

      // Get or create cart
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

      const now = new Date().toISOString();

      // Check if item already exists in cart with same variants
      const variantSelectionsString = JSON.stringify(variantSelections);
      
      const { data: existingItems, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', product_id)
        .eq('variant_selections', variantSelectionsString);

      if (checkError) {
        console.error('Check existing item error:', checkError);
        throw checkError;
      }

      const existingItem = existingItems?.[0];
      console.log('Existing item check:', existingItem);

      if (existingItem) {
        console.log('Updating existing item quantity');
        // Update existing item quantity
        const { data: updateData, error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: now
          })
          .eq('id', existingItem.id)
          .select();

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }
        
        console.log('Update result:', updateData);
      } else {
        console.log('Inserting new cart item');
        // Add new item to cart - REMOVED items field, keeping only necessary data
        const insertData = {
          cart_id: cartId, 
          product_id: product_id,
          variant_selections: variantSelections, // This should contain the actual selected variants
          quantity: quantity,
          added_at: now,
          updated_at: now
        };

        console.log('Insert data:', insertData);

        const { data: insertResult, error: insertError } = await supabase
          .from('cart_items')
          .insert(insertData)
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        console.log('Insert result:', insertResult);
      }

      // Wait a moment for trigger to fire
      await new Promise(resolve => setTimeout(resolve, 200));

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
        description: `Failed to add item to cart: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    // Optimistic update
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === itemId ? { 
          ...item, 
          quantity
        } : item
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

      // Wait for trigger to fire and refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchCart();
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive"
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
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

      // Wait for trigger to fire and refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchCart();
      
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
  };

  const clearCart = async () => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      // Wait for trigger and refresh
      await new Promise(resolve => setTimeout(resolve, 200));
      await fetchCart();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
    }
  };

  const updateCartStatus = async (status: 'active' | 'checkout' | 'completed' | 'abandoned') => {
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
  };

  // Handle cart migration when user logs in using SQL function
  const migrateGuestCart = async () => {
    if (!user) return;

    const sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) return;

    try {
      const { data: migrationSuccess, error } = await supabase.rpc('migrate_guest_cart_to_user', {
        p_user_id: user.id,
        p_session_id: sessionId
      });

      if (error) throw error;

      if (migrationSuccess) {
        localStorage.removeItem('cart_session_id');
        console.log('Cart migration successful');
      }
    } catch (error) {
      console.error('Error migrating guest cart:', error);
    }
  };

  useEffect(() => {
    if (user) {
      migrateGuestCart().then(() => fetchCart());
    } else {
      fetchCart();
    }
  }, [user]);

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
