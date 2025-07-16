
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { useChatAutoReply } from '@/hooks/useChatAutoReply';
import { useChatMessagesRead } from '@/hooks/useChatMessagesRead';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  user_id?: string;
}

export const useRealtimeChat = () => {
  const { user } = useAuth();
  const { messages, setMessages } = useChatHistory();
  const { isTyping, processAutoReply } = useChatAutoReply();
  const { markMessagesAsRead } = useChatMessagesRead();

  const handleNewMessage = useCallback((newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
  }, [setMessages]);

  useChatRealtime({ onNewMessage: handleNewMessage });

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;
    await processAutoReply(messageText);
  };

  return {
    messages,
    sendMessage,
    isTyping,
    markMessagesAsRead
  };
};

