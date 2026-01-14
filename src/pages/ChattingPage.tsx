import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Headphones, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';

const ChattingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, isLoading, isStreaming, sendMessage, requestAdmin, conversation } = useChat();
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Bot className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to Chat</h2>
        <p className="text-muted-foreground text-center mb-4">
          Please sign in to access our customer support chat.
        </p>
        <Button onClick={() => navigate('/auth', { state: { redirectAfterAuth: '/chat' } })}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-3xl mx-auto">
      {/* Chat Header */}
      <div className="bg-primary text-primary-foreground p-4 /rounded-t-lg md:mt-4 flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-md">SmartKenya Assistant</h3>
          <p className="text-sm opacity-80">
            {conversation?.status === 'pending_admin' 
              ? 'Waiting for admin response...' 
              : 'AI-powered support • Available 24/7'}
          </p>
        </div>
        {conversation?.status === 'pending_admin' && (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Headphones className="h-3 w-3 mr-1" />
            Admin Requested
          </Badge>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4 bg-background border-x">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">How can we help you?</h3>
              <p className="text-sm max-w-sm mx-auto">
                Ask me anything about products, orders, returns, or any other questions you have.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.sender_type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.sender_type !== 'user' && (
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className={cn(
                    message.sender_type === 'admin' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-primary/10 text-primary'
                  )}>
                    {message.sender_type === 'admin' ? <Headphones className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                message.sender_type === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-md' 
                  : 'bg-muted rounded-bl-md'
              )}>
                {message.sender_type === 'admin' && (
                  <Badge variant="secondary" className="mb-2 text-xs">Support Agent</Badge>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                <p className={cn(
                  "text-[11px] mt-2",
                  message.sender_type === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                )}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.sender_type === 'user' && (
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-secondary">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Request Admin Button */}
      {conversation?.status === 'active' && messages.length > 2 && (
        <div className="px-4 py-2 bg-background border-x">
          <Button
            variant="outline"
            size="sm"
            onClick={requestAdmin}
            className="w-full"
          >
            <Headphones className="h-4 w-4 mr-2" />
            Talk to a human agent
          </Button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border bottom-4 right-0 left-0 fixed rounded-b-lg bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChattingPage;
