import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, Bot, Headphones, MessageCircle, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminChat } from '@/hooks/useAdminChat';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { AdminLayout } from '@/components/admin/AdminLayout';

const AdminChatPage = () => {
  const {
    conversations,
    selectedConversation,
    messages,
    isLoading,
    selectConversation,
    sendMessage,
    closeConversation,
  } = useAdminChat();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return 'bg-yellow-100 text-yellow-700';
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_admin':
        return <AlertCircle className="h-3 w-3" />;
      case 'active':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'closed':
        return <Clock className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const pendingCount = conversations.filter(c => c.status === 'pending_admin').length;

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Customer Chat</h1>
            <p className="text-muted-foreground">Manage customer conversations</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingCount} awaiting reply
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-4rem)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Conversations ({conversations.length})
              </CardTitle>
            </CardHeader>
            <ScrollArea className="h-[calc(100%-3.5rem)]">
              <div className="p-2 space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedConversation?.id === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-secondary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {conv.profiles?.first_name || conv.profiles?.email?.split('@')[0] || 'User'}
                            </p>
                            <Badge className={cn("text-[10px] shrink-0", getStatusColor(conv.status))}>
                              {getStatusIcon(conv.status)}
                              <span className="ml-1 capitalize">{conv.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {conv.last_message || 'No messages'}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true })}
                            </p>
                            {(conv.unread_count ?? 0) > 0 && (
                              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {selectedConversation.profiles?.first_name || 'Customer'}
                        {selectedConversation.profiles?.last_name && ` ${selectedConversation.profiles.last_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(selectedConversation.status)}>
                      {selectedConversation.status.replace('_', ' ')}
                    </Badge>
                    {selectedConversation.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => closeConversation(selectedConversation.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea ref={scrollRef} className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2",
                          message.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.sender_type !== 'admin' && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn(
                              message.sender_type === 'ai' 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-secondary'
                            )}>
                              {message.sender_type === 'ai' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-2",
                          message.sender_type === 'admin'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : message.sender_type === 'ai'
                            ? 'bg-blue-50 border border-blue-100 rounded-bl-md'
                            : 'bg-muted rounded-bl-md'
                        )}>
                          {message.sender_type === 'ai' && (
                            <Badge variant="secondary" className="mb-1 text-[10px]">AI Response</Badge>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={cn(
                            "text-[10px] mt-1",
                            message.sender_type === 'admin' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}>
                            {format(new Date(message.created_at), 'HH:mm')}
                          </p>
                        </div>

                        {message.sender_type === 'admin' && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className="bg-green-100 text-green-600">
                              <Headphones className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Type your reply..."
                        className="flex-1"
                      />
                      <Button onClick={handleSend} disabled={!inputValue.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminChatPage;
