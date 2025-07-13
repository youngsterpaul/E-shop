
import { supabase } from '@/integrations/supabase/client';

export const cartService = {
  getOrCreateCart: async (userId: string | null, sessionId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_cart', {
        p_user_id: userId,
        p_session_id: userId ? null : sessionId
      });

      if (error) {
        console.error('Error getting/creating cart:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cart service error:', error);
      return null;
    }
  },

  updateCartStatus: async (cartId: string, status: 'active' | 'checkout' | 'completed' | 'abandoned'): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('carts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', cartId);

      if (error) {
        console.error('Error updating cart status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating cart status:', error);
      return false;
    }
  },

  clearExpiredCarts: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_carts');

      if (error) {
        console.error('Error clearing expired carts:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing expired carts:', error);
      return false;
    }
  }
};
