
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
  }
};
