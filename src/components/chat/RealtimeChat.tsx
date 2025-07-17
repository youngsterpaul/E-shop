
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send } from 'lucide-react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { formatWhatsAppDate, shouldShowDateSeparator } from '@/utils/dateFormatting';
import MobileNav from '../MobileNav';

const RealtimeChat = () => {
  const [message, setMessage] = useState('');
  const { messages, sendMessage, isTyping, markMessagesAsRead } = useRealtimeChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when component mounts or user opens chat
  useEffect(() => {
    if (user) {
      markMessagesAsRead();
    }
  }, [user, markMessagesAsRead]);

  const handleSendMessage = () => {
    if (!message.trim() || !user) return;
    sendMessage(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card className="h-[600px] flex flex-col items-center justify-center">
        <CardContent className="text-center">
          <h3 className="text-lg font-semibold mb-4">Please sign in to start chatting</h3>
          <p className="text-gray-600 mb-6">You need to be logged in to access customer support chat.</p>
          <Link to="/auth/signin">
            <Button className="bg-primary hover:bg-primary/90">
              Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">Live Chat Support</CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col">
        {/* Messages with overflow scrolling */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded max-h-[400px]">
          {messages.map((msg, index) => {
            const showDateSeparator = shouldShowDateSeparator(
              msg.timestamp, 
              index > 0 ? messages[index - 1].timestamp : undefined
            );

            return (
              <div key={msg.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatWhatsAppDate(msg.timestamp)}
                    </div>
                  </div>
                )}
                
                {/* Message */}
                <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-primary hover:bg-primary/90"
            size="icon"
            disabled={isTyping || !message.trim()}
          >
            <Send size={20} />
          </Button>
        </div>
      </CardContent>
    </Card>
    {isTyping && <MobileNav />}
    </div>
  );
};

export default RealtimeChat;
