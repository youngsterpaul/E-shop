import { useState, useEffect } from 'react';
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
  items: any; // Additional item data/metadata
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

  // Generate session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cart_session_id', sessionId);
    }
    return sessionId;
  };

  // Get or create cart
  const getOrCreateCart = async () => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: user?.id || undefined,
        p_session_id: user ? undefined : getSessionId()
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  };

  // Update cart totals - centralized function
  const updateCartTotals = async (cartId: string) => {
    try {
      // Calculate totals from cart items
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select('quantity, products!fk_cart_items_product_id(price)')
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

      return { itemCount, totalAmount };
    } catch (error) {
      console.error('Error updating cart totals:', error);
      return { itemCount: 0, totalAmount: 0 };
    }
  };

  // Fetch cart and cart items
  const fetchCart = async () => {
    if (!user && !getSessionId()) {
      setLoading(false);
      return;
    }

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

      // Fetch cart items with all fields including timestamps
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
          products!fk_cart_items_product_id (
            product_id,
            name,
            price,
            image_urls
          )
        `)
        .eq('cart_id', cartId)
        .order('added_at', { ascending: false }); // Most recent first

      if (itemsError) throw itemsError;

      const formattedItems: CartItem[] = itemsData?.map(item => ({
        id: item.id,
        cart_id: item.cart_id || '',
        product_id: item.product_id || '',
        product: {
          id: item.products?.product_id || '',
          name: item.products?.name || '',
          price: item.products?.price || 0,
          image: item.products?.image_urls?.[0] || ''
        },
        items: item.items,
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
    productId: string, 
    variantSelections: any = {}, 
    quantity: number = 1,
    itemMetadata: any = null // Additional item data
  ) => {
    if (!user && !getSessionId()) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to add items to cart",
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
        .eq('product_id', productId)
        .eq('variant_selections', JSON.stringify(variantSelections))
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingItem) {
        // Update existing item quantity and timestamp
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            updated_at: now
          })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Add new item to cart with all required fields
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            items: itemMetadata,
            variant_selections: variantSelections,
            quantity: quantity,
            user_id: user?.id || null,
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
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // Find the item to get cart_id
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    // Optimistic update for immediate UI feedback
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
        // Revert optimistic update on error
        await fetchCart();
        throw error;
      }

      // Update cart totals
      await updateCartTotals(item.cart_id);
      
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
    // Find the item to get cart_id before removing
    const item = cartItems.find(item => item.id === itemId);
    if (!item) return;

    // Optimistic update for immediate UI feedback
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        // Revert optimistic update on error
        await fetchCart();
        throw error;
      }

      // Update cart totals
      await updateCartTotals(item.cart_id);
      
      // Update local cart state
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

  useEffect(() => {
    fetchCart();
  }, [user]);

  // Use cart totals from database instead of calculating in frontend
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