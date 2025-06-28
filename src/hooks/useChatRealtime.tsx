
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  user_id?: string;
}

interface UseChatRealtimeProps {
  onNewMessage: (message: Message) => void;
}

export const useChatRealtime = ({ onNewMessage }: UseChatRealtimeProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new.id,
            text: payload.new.text,
            sender: payload.new.sender === 'support' ? 'support' : 'user',
            timestamp: new Date(payload.new.timestamp),
            user_id: payload.new.user_id
          };
          onNewMessage(newMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onNewMessage]);
};
