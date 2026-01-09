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

interface Conversation {
  id: string;
  user_id: string;
  status: 'active' | 'closed' | 'pending_admin';
  last_message_at: string;
  created_at: string;
}

export const useChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Get or create conversation for current user
  const getOrCreateConversation = useCallback(async () => {
    if (!user) return null;

    try {
      // Check for existing active conversation
      const { data: existing, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existing) {
        setConversation(existing as Conversation);
        return existing as Conversation;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (createError) throw createError;
      setConversation(newConv as Conversation);
      return newConv as Conversation;
    } catch (error) {
      console.error('Error getting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      });
      return null;
    }
  }, [user, toast]);

  // Load messages for conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  // Send message and get AI response
  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    setIsLoading(true);
    try {
      let conv = conversation;
      if (!conv) {
        conv = await getOrCreateConversation();
        if (!conv) return;
      }

      // Save user message to database
      const { data: userMsg, error: userMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conv.id,
          sender_type: 'user',
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;
      
      setMessages(prev => [...prev, userMsg as Message]);

      // Get AI response with streaming
      setIsStreaming(true);
      const messagesForAI = [...messages, userMsg].map(m => ({
        role: m.sender_type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            messages: messagesForAI,
            conversationId: conv.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      let textBuffer = '';

      // Add placeholder for AI message
      const tempAiMsgId = `temp-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: tempAiMsgId,
        conversation_id: conv!.id,
        sender_type: 'ai',
        sender_id: null,
        content: '',
        is_read: false,
        created_at: new Date().toISOString(),
      }]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              aiContent += content;
              setMessages(prev => prev.map(m => 
                m.id === tempAiMsgId ? { ...m, content: aiContent } : m
              ));
            }
          } catch {
            // Incomplete JSON, continue
          }
        }
      }

      // Save AI message to database
      if (aiContent) {
        const { data: aiMsg, error: aiMsgError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conv.id,
            sender_type: 'ai',
            sender_id: null,
            content: aiContent,
          })
          .select()
          .single();

        if (aiMsgError) throw aiMsgError;

        // Replace temp message with real one
        setMessages(prev => prev.map(m => 
          m.id === tempAiMsgId ? (aiMsg as Message) : m
        ));

        // Update conversation last_message_at
        await supabase
          .from('chat_conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conv.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Request human admin
  const requestAdmin = async () => {
    if (!conversation) return;

    try {
      await supabase
        .from('chat_conversations')
        .update({ status: 'pending_admin' })
        .eq('id', conversation.id);

      setConversation(prev => prev ? { ...prev, status: 'pending_admin' } : null);

      // Add system message
      const { data: msg } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'ai',
          content: "I've notified our support team. An admin will respond to you shortly.",
        })
        .select()
        .single();

      if (msg) {
        setMessages(prev => [...prev, msg as Message]);
      }

      toast({
        title: "Request sent",
        description: "An admin will respond shortly",
      });
    } catch (error) {
      console.error('Error requesting admin:', error);
    }
  };

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if not already in messages (avoid duplicates from own messages)
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  // Initialize conversation and load messages
  useEffect(() => {
    if (user) {
      getOrCreateConversation().then(conv => {
        if (conv) loadMessages(conv.id);
      });
    }
  }, [user, getOrCreateConversation, loadMessages]);

  return {
    conversation,
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    requestAdmin,
  };
};
