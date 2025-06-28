
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useChatAutoReply = () => {
  const [isTyping, setIsTyping] = useState(false);
  const responseTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();

  const getAutoReply = async (messageText: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('get_auto_reply_response', {
        message_text: messageText
      });

      if (error) {
        console.error('Error getting auto reply:', error);
        return null;
      }

      return typeof data === 'string' ? data : null;
    } catch (error) {
      console.error('Error calling auto reply function:', error);
      return null;
    }
  };

  const saveMessageToDatabase = async (text: string, sender: 'user' | 'support' = 'user') => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          text: text,
          sender: sender,
          session_id: `session_${user.id}`
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const notifyAdminIfNoReply = async (messageId: string, messageText: string) => {
    if (!user || !messageId) return;

    try {
      const { error } = await supabase
        .rpc('notify_admin_no_reply', {
          user_message_id: messageId,
          user_id: user.id,
          message_text: messageText
        });

      if (error) {
        console.error('Error notifying admin:', error);
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              type: 'chat_no_reply',
              title: 'New chat message needs attention',
              message: `User message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`
            });
        } catch (fallbackError) {
          console.log('Could not create admin notification - table may not exist yet');
        }
      }
    } catch (error) {
      console.error('Error notifying admin:', error);
    }
  };

  const processAutoReply = async (messageText: string) => {
    const userMessage = await saveMessageToDatabase(messageText, 'user');

    setIsTyping(true);

    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }

    responseTimeoutRef.current = setTimeout(async () => {
      try {
        const autoReplyText = await getAutoReply(messageText);
        
        if (autoReplyText) {
          await saveMessageToDatabase(autoReplyText, 'support');
        } else {
          if (userMessage?.id) {
            await notifyAdminIfNoReply(userMessage.id, messageText);
          }
          
          const fallbackMessage = 'Thank you for your message. Our support team will assist you shortly.';
          await saveMessageToDatabase(fallbackMessage, 'support');
        }

      } catch (error) {
        console.error('Error sending auto reply:', error);
        const fallbackMessage = 'I apologize, but I\'m having trouble responding right now. Please try again.';
        await saveMessageToDatabase(fallbackMessage, 'support');
      } finally {
        setIsTyping(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    processAutoReply
  };
};
