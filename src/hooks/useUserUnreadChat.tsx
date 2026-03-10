import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useUserUnreadChat = () => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      // Get user's conversation
      const { data: conv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!conv) {
        setUnreadCount(0);
        return;
      }

      // Count unread admin messages in user's conversation
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .eq('sender_type', 'admin');

      if (!error) {
        setUnreadCount(count || 0);
      }
    };

    fetchUnreadCount();

    // Real-time subscription for new admin messages
    const channel = supabase
      .channel('user-chat-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_type === 'admin') {
            // Check if this message belongs to user's conversation
            fetchUnreadCount();
            playNotificationSound();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playNotificationSound]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!user) return;

    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (conv) {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conv.id)
        .eq('sender_type', 'admin')
        .eq('is_read', false);

      setUnreadCount(0);
    }
  }, [user]);

  return { unreadCount, markAsRead, playNotificationSound };
};
