
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ChatSession {
  session_id: string;
  user_id?: string;
  last_message: string;
  last_timestamp: string;
  unread_count: number;
  user_email?: string;
  user_name?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
  user_id?: string;
  session_id: string;
  is_read: boolean;
}

const AdminChatPage = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchChatSessions();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      fetchMessages(selectedSession);
      markMessagesAsRead(selectedSession);
    }
  }, [selectedSession]);

  const fetchChatSessions = async () => {
    try {
      console.log('Fetching chat sessions...');
      
      // Get unique sessions with latest message and unread count
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      console.log('Messages data:', messagesData);

      // Get user profiles for email lookup
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      console.log('Profiles data:', profilesData);

      // Group by session and get session info
      const sessionMap = new Map<string, ChatSession>();
      
      messagesData?.forEach((msg: any) => {
        const sessionId = msg.session_id;
        if (!sessionMap.has(sessionId)) {
          // Find user profile
          const userProfile = profilesData?.find(p => p.user_id === msg.user_id);
          const userName = userProfile 
            ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
            : '';
          
          sessionMap.set(sessionId, {
            session_id: sessionId,
            user_id: msg.user_id,
            last_message: msg.text,
            last_timestamp: msg.timestamp,
            unread_count: 0,
            user_email: userProfile?.email || 'Guest User',
            user_name: userName || 'Unknown User',
          });
        }
        
        // Count unread messages from users
        if (!msg.is_read && msg.sender === 'user') {
          const session = sessionMap.get(sessionId)!;
          session.unread_count++;
        }
      });

      const sessionsArray = Array.from(sessionMap.values());
      console.log('Processed sessions:', sessionsArray);
      setSessions(sessionsArray);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      console.log('Fetching messages for session:', sessionId);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      console.log('Fetched messages:', data);

      const typedMessages: Message[] = (data || []).map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender as 'user' | 'admin',
        timestamp: msg.timestamp,
        user_id: msg.user_id || undefined,
        session_id: msg.session_id,
        is_read: msg.is_read ?? false
      }));

      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('session_id', sessionId)
        .eq('sender', 'user');

      if (error) {
        console.error('Error marking messages as read:', error);
      } else {
        // Update local sessions state to reflect read status
        setSessions(prev => prev.map(session => 
          session.session_id === sessionId 
            ? { ...session, unread_count: 0 }
            : session
        ));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;
    
    try {
      const messageData = {
        text: newMessage.trim(),
        sender: 'admin',
        session_id: selectedSession,
        timestamp: new Date().toISOString(),
        is_read: true,
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert([messageData]);

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin_chat_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('New message received in admin:', payload);
          const newMessage = payload.new as any;
          const typedMessage: Message = {
            id: newMessage.id,
            text: newMessage.text,
            sender: newMessage.sender as 'user' | 'admin',
            timestamp: newMessage.timestamp,
            user_id: newMessage.user_id,
            session_id: newMessage.session_id,
            is_read: newMessage.is_read
          };
          
          // Update messages if viewing this session
          if (typedMessage.session_id === selectedSession) {
            setMessages(prev => {
              // Prevent duplicate messages
              if (prev.find(msg => msg.id === typedMessage.id)) {
                return prev;
              }
              return [...prev, typedMessage];
            });
          }
          
          // Refresh sessions to update unread counts
          fetchChatSessions();
          
          // Play notification sound for user messages
          if (typedMessage.sender === 'user') {
            playNotificationSound();
            toast({
              title: "New message from user",
              description: typedMessage.text.substring(0, 50) + '...',
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('Admin chat subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading chats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1 flex">
        {/* Chat Sessions List */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Chat Sessions</h2>
            <p className="text-sm text-gray-600">{sessions.length} active sessions</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No chat sessions yet</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  onClick={() => setSelectedSession(session.session_id)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedSession === session.session_id ? 'bg-orange-50 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm">
                        {session.user_name || session.user_email}
                      </span>
                    </div>
                    {session.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {session.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {session.last_message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(session.last_timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              <div className="p-4 border-b bg-white">
                <h3 className="font-semibold">
                  {sessions.find(s => s.session_id === selectedSession)?.user_name || 
                   sessions.find(s => s.session_id === selectedSession)?.user_email || 'Chat'}
                </h3>
                <p className="text-sm text-gray-600">
                  Session: {selectedSession.substring(0, 8)}...
                </p>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'admin'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-white">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select a chat session to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPage;
