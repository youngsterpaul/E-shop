
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
  is_read: boolean;
  user_id?: string;
}

export const useAdminChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      const typedMessages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender as 'user' | 'support',
        timestamp: msg.timestamp,
        is_read: msg.is_read ?? false,
        user_id: msg.user_id || undefined
      }));

      setMessages(typedMessages);

      // Mark admin messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('sender', 'user')
        .eq('is_read', false);

    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    }
  };

  const sendReply = async (userId: string, messageText: string) => {
    if (!messageText.trim() || loading) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: userId,
          text: messageText.trim(),
          sender: 'support',
          session_id: `session_${userId}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reply sent successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    loadMessages,
    sendReply
  };
};
