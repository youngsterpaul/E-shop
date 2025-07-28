import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  items: {
    id: string;
    name: string;
    price: number;
    image: string;
    [key: string]: any;
  };
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

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  };

  // Update cart totals using SQL function
  const updateCartTotals = async (cartId: string) => {
    try {
      const { data, error } = await supabase.rpc('update_cart_totals', {
        cart_id_param: cartId
      });

      if (error) throw error;
      
      const result = data?.[0];
      return {
        itemCount: result?.item_count || 0,
        totalAmount: result?.total_amount || 0
      };
    } catch (error) {
      console.error('Error updating cart totals:', error);
      return { itemCount: 0, totalAmount: 0 };
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

      // Fetch cart items
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
          updated_at
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false });

      if (itemsError) throw itemsError;

      const formattedItems: CartItem[] = itemsData?.map(item => ({
        id: item.id,
        cart_id: item.cart_id || '',
        product_id: item.product_id || '', 
        items: item.items || {},
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
    itemData: {
      id: string;
      name: string;
      price: number;
      image: string;
      [key: string]: any;
    },
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

      const now = new Date().toISOString();

      // Check if item already exists in cart with same variants
      const { data: existingItem, error: checkError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('items->>id', itemData.id)
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
            product_id: product_id,
            items: itemData,
            variant_selections: variantSelections,
            quantity: quantity,
            added_at: now,
            updated_at: now
          });

        if (insertError) throw insertError;
      }

      // Totals will be updated automatically by trigger
      // But we still refresh cart data for UI
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

      // Totals updated automatically by trigger
      // Update local cart state
      if (cart) {
        const totals = await updateCartTotals(cart.id);
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

      // Totals updated automatically by trigger
      if (cart) {
        const totals = await updateCartTotals(cart.id);
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
  };

  const clearCart = async () => {
    if (!cart) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      if (error) throw error;

      // Totals will be updated automatically by trigger
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
        // Clear session ID after successful migration
        localStorage.removeItem('cart_session_id');
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
