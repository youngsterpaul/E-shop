
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useChatMessagesRead = () => {
  const { user } = useAuth();

  const markMessagesAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('sender', 'support')
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    markMessagesAsRead
  };
};
