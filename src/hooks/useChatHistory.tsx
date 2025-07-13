
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  user_id?: string;
}

export const useChatHistory = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();

  const loadChatHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender === 'support' ? 'support' : 'user',
        timestamp: new Date(msg.timestamp),
        user_id: msg.user_id
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  return {
    messages,
    setMessages,
    loadChatHistory
  };
};
