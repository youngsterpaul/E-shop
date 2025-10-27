
import { supabase } from '@/integrations/supabase/client';

export interface CartService {
  getOrCreateCart: (userId?: string, sessionId?: string) => Promise<string | null>;
  getCartWithItems: (cartId: string) => Promise<any>;
  updateCartStatus: (cartId: string, status: string) => Promise<void>;
  clearExpiredCarts: () => Promise<void>;
}

export const cartService: CartService = {
  async getOrCreateCart(userId?: string, sessionId?: string) {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: userId || undefined,
        p_session_id: sessionId || undefined
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  },

  async getCartWithItems(cartId: string) {
    try {
      // Get cart details
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('id', cartId)
        .single();

      if (cartError) throw cartError;

      // Get cart items
      const { data: items, error: itemsError } = await supabase
        .from('cart_items')
        .select(`
          *,
          products!inner (*)
        `)
        .eq('cart_id', cartId);

      if (itemsError) throw itemsError;

      return { cart, items };
    } catch (error) {
      console.error('Error fetching cart with items:', error);
      throw error;
    }
  },

  async updateCartStatus(cartId: string, status: string) {
    try {
      const { error } = await supabase
        .from('carts')
        .update({ status })
        .eq('id', cartId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating cart status:', error);
      throw error;
    }
  },

  async clearExpiredCarts() {
    try {
      const { error } = await supabase.rpc('cleanup_expired_carts');
      if (error) throw error;
    } catch (error) {
      console.error('Error clearing expired carts:', error);
    }
  }
};
