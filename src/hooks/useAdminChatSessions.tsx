
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatSession {
  user_id: string;
  user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  user_name?: string;
}

export const useAdminChatSessions = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const { toast } = useToast();

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          user_id,
          text,
          timestamp,
          sender,
          is_read
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Group messages by user and get latest info
      const sessionMap = new Map();
      
      data?.forEach((msg) => {
        if (!sessionMap.has(msg.user_id)) {
          sessionMap.set(msg.user_id, {
            user_id: msg.user_id,
            last_message: msg.text,
            last_message_time: msg.timestamp,
            unread_count: 0,
            user_email: '',
            user_name: ''
          });
        }
        
        // Count unread messages from users (not support)
        if (msg.sender === 'user' && !msg.is_read) {
          const session = sessionMap.get(msg.user_id);
          session.unread_count++;
        }
      });

      // Get user profiles for names and emails
      const userIds = Array.from(sessionMap.keys());
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, email, first_name, last_name')
          .in('user_id', userIds);

        profiles?.forEach((profile) => {
          const session = sessionMap.get(profile.user_id);
          if (session) {
            session.user_email = profile.email;
            session.user_name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          }
        });
      }

      setChatSessions(Array.from(sessionMap.values()));
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, []);

  return {
    chatSessions,
    loadChatSessions
  };
};
