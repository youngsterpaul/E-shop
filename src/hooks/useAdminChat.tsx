import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'ai' | 'admin';
  sender_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ConversationProfile {
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface Conversation {
  id: string;
  user_id: string;
  status: 'active' | 'closed' | 'pending_admin';
  last_message_at: string;
  created_at: string;
  profiles?: ConversationProfile;
  unread_count?: number;
  last_message?: string;
}

export const useAdminChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get conversations
      const { data: convData, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (convError) throw convError;

      // Get profiles and additional details for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          // Get profile
          let profiles: ConversationProfile | undefined;
          if (conv.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('user_id', conv.user_id)
              .maybeSingle();
            if (profileData) {
              profiles = profileData;
            }
          }

          // Get unread count
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .eq('sender_type', 'user');

          // Get last message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            profiles,
            unread_count: count || 0,
            last_message: lastMsg?.content || '',
          } as Conversation;
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);

      // Mark messages as read
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'user');
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Send admin message
  const sendMessage = async (content: string) => {
    if (!user || !selectedConversation || !content.trim()) return;

    try {
      const { data: msg, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_type: 'admin',
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, msg as Message]);

      // Update conversation
      await supabase
        .from('chat_conversations')
        .update({ 
          last_message_at: new Date().toISOString(),
          status: 'active',
        })
        .eq('id', selectedConversation.id);

      // Refresh conversations list
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Close conversation
  const closeConversation = async (conversationId: string) => {
    try {
      await supabase
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({
        title: "Conversation closed",
      });
    } catch (error) {
      console.error('Error closing conversation:', error);
    }
  };

  // Delete conversation and all messages
  const deleteConversation = async (conversationId: string) => {
    try {
      // First delete all messages in the conversation
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        throw messagesError;
      }
      
      console.log('Messages deleted for conversation:', conversationId);

      // Then delete the conversation
      const { error: convError, data: deletedConv } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .select();

      if (convError) {
        console.error('Error deleting conversation:', convError);
        throw convError;
      }
      
      console.log('Conversation deleted:', deletedConv);

      // Verify deletion was successful
      if (!deletedConv || deletedConv.length === 0) {
        throw new Error('Conversation was not deleted - check RLS policies');
      }

      // Update local state
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation and all messages have been removed",
      });
      
      return true;
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation",
        variant: "destructive",
      });
      return false;
    }
  };

  // Select conversation
  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    loadMessages(conv.id);
  };

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Update messages if in selected conversation
          if (selectedConversation?.id === newMessage.conversation_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
          
          // Refresh conversations list
          loadConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, loadConversations]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    selectConversation,
    sendMessage,
    closeConversation,
    deleteConversation,
    loadConversations,
  };
};
