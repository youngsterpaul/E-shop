
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { ChatSession } from '@/hooks/useAdminChatSessions';
import { ChatMessage } from '@/hooks/useAdminChatMessages';
import { formatWhatsAppDate, shouldShowDateSeparator } from '@/utils/dateFormatting';

interface ChatInterfaceProps {
  selectedSession: ChatSession | undefined;
  messages: ChatMessage[];
  loading: boolean;
  onSendReply: (messageText: string) => Promise<boolean>;
}

const ChatInterface = ({ selectedSession, messages, loading, onSendReply }: ChatInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSendReply = async () => {
    if (!newMessage.trim()) return;
    
    const success = await onSendReply(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          {selectedSession ? (
            <div>
              <p className="text-lg">{selectedSession.user_name || 'Unknown User'}</p>
              <p className="text-sm text-gray-500 font-normal">{selectedSession.user_email}</p>
            </div>
          ) : (
            'Select a chat to begin'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        {selectedSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded">
              {messages.map((message, index) => {
                const messageDate = new Date(message.timestamp);
                const showDateSeparator = shouldShowDateSeparator(
                  messageDate,
                  index > 0 ? new Date(messages[index - 1].timestamp) : undefined
                );

                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatWhatsAppDate(messageDate)}
                        </div>
                      </div>
                    )}
                    
                    {/* Message */}
                    <div className={`flex ${message.sender === 'support' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'support'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {messageDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="flex gap-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                disabled={loading}
              />
              <Button 
                onClick={handleSendReply}
                disabled={loading || !newMessage.trim()}
                size="icon"
              >
                <Send size={20} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat session to view messages and reply
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
