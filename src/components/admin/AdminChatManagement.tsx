
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminChatSessions } from '@/hooks/useAdminChatSessions';
import { useAdminChatMessages } from '@/hooks/useAdminChatMessages';
import ChatSessionsList from './ChatSessionsList';
import ChatInterface from './ChatInterface';

const AdminChatManagement = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { chatSessions, loadChatSessions } = useAdminChatSessions();
  const { messages, loading, loadMessages, sendReply } = useAdminChatMessages();

  // Setup realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          loadChatSessions();
          if (selectedUserId === payload.new.user_id) {
            loadMessages(selectedUserId);
          }
          
          // Play notification sound for new user messages
          if (payload.new.sender === 'user') {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUserId]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  const selectUser = (userId: string) => {
    setSelectedUserId(userId);
    loadMessages(userId);
  };

  const handleSendReply = async (messageText: string) => {
    if (!selectedUserId) return false;
    
    const success = await sendReply(selectedUserId, messageText);
    if (success) {
      await loadMessages(selectedUserId);
      await loadChatSessions();
    }
    return success;
  };

  const selectedSession = chatSessions.find(s => s.user_id === selectedUserId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <ChatSessionsList 
        chatSessions={chatSessions}
        selectedUserId={selectedUserId}
        onSelectUser={selectUser}
      />
      <ChatInterface 
        selectedSession={selectedSession}
        messages={messages}
        loading={loading}
        onSendReply={handleSendReply}
      />
    </div>
  );
};

export default AdminChatManagement;
