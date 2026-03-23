import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, User, Bot, Headphones, Loader2, Sparkles, MessageSquareText, ZapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useUserUnreadChat } from '@/hooks/useUserUnreadChat';

/* Thin custom scrollbar — injected once */
const scrollbarStyle = `
  .chat-messages::-webkit-scrollbar { width: 3px; }
  .chat-messages::-webkit-scrollbar-track { background: transparent; }
  .chat-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 99px; }
  .chat-messages::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
  .chat-messages { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.12) transparent; }
`;

const ChatWidget = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = isMobileUserAgent();
  const { messages, isLoading, isStreaming, sendMessage, requestAdmin, conversation } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unreadCount } = useUserUnreadChat();
  const widgetRef = useRef<HTMLDivElement>(null);

  /* --------------------------------
     Inject thin scrollbar styles once
  -------------------------------- */
  useEffect(() => {
    if (document.getElementById('chat-scrollbar-style')) return;
    const el = document.createElement('style');
    el.id = 'chat-scrollbar-style';
    el.textContent = scrollbarStyle;
    document.head.appendChild(el);
  }, []);

  /* --------------------------------
     Click outside → close
  -------------------------------- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Small delay so the trigger click doesn't immediately close
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [isOpen]);

  /* --------------------------------
     Auto-scroll — smooth
  -------------------------------- */
  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  useEffect(() => {
    if (isOpen) setTimeout(scrollToBottom, 100);
  }, [isOpen, scrollToBottom]);

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

  if (!user || isMobile || location.pathname === '/chat') return null;

  return (
    <div ref={widgetRef}>
      {/* ─────────────────────────────────────
          Floating Trigger Button
      ───────────────────────────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="fixed bottom-20 right-5 z-50 md:bottom-7"
          >
            {/* Glow ring */}
            <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping opacity-60" />

            <button
              onClick={() => setIsOpen(true)}
              className="relative h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <ZapIcon className="h-6 w-6 fill-current" />
            </button>

            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow-md"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────
          Chat Window
      ───────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-[390px] md:bottom-6"
          >
            <div className="flex flex-col h-[520px] rounded-2xl shadow-2xl overflow-hidden border border-border/60 bg-background">

              {/* ── Header ── */}
              <div className="relative shrink-0 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground px-4 py-3.5 flex items-center justify-between overflow-hidden">
                {/* Decorative blur orbs */}
                <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-4 right-10 w-20 h-20 rounded-full bg-white/10 blur-2xl pointer-events-none" />

                <div className="relative flex items-center gap-3">
                  {/* Bot avatar */}
                  <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
                    <Sparkles className="h-4.5 w-4.5 text-white" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm leading-tight tracking-tight">
                      SmartKenya Assistant
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <p className="text-[11px] opacity-80">
                        {conversation?.status === 'pending_admin'
                          ? 'Connecting to agent…'
                          : 'Online · AI-powered'}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="relative h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 transition-colors focus:outline-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Messages ─────────────────────────
                  flex-1 + overflow-y-auto = self-contained
                  scroll, exactly like WhatsApp widget
              ─────────────────────────────────────── */}
              <div
                ref={messagesContainerRef}
                className="chat-messages flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4 bg-slate-50/40 dark:bg-muted/20"
              >
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-primary/8 border border-primary/10 flex items-center justify-center">
                      <MessageSquareText className="h-6 w-6 text-primary/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Hi there 👋</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ask about orders, products, or returns.
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((message) => {
                  const isUser = message.sender_type === 'user';
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn('flex gap-2 items-end', isUser ? 'justify-end' : 'justify-start')}
                    >
                      {!isUser && (
                        <Avatar className="h-7 w-7 shrink-0 mb-0.5">
                          <AvatarFallback
                            className={cn(
                              'text-[10px] rounded-lg',
                              message.sender_type === 'admin'
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-primary/10 text-primary'
                            )}
                          >
                            {message.sender_type === 'admin' ? (
                              <Headphones className="h-3.5 w-3.5" />
                            ) : (
                              <Bot className="h-3.5 w-3.5" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={cn('flex flex-col gap-1 max-w-[78%]', isUser ? 'items-end' : 'items-start')}>
                        {message.sender_type === 'admin' && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 uppercase bg-emerald-50 text-emerald-700 border-emerald-100"
                          >
                            Agent
                          </Badge>
                        )}

                        <div
                          className={cn(
                            'px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm',
                            isUser
                              ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                              : 'bg-white dark:bg-muted border border-border/50 rounded-2xl rounded-bl-md text-foreground'
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        <span className="text-[10px] text-muted-foreground px-1">
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {isUser && (
                        <Avatar className="h-7 w-7 shrink-0 mb-0.5">
                          <AvatarFallback className="bg-slate-200 text-slate-500 rounded-lg text-[10px]">
                            <User className="h-3.5 w-3.5" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  );
                })}

                {/* Typing indicator */}
                {isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 items-end justify-start"
                  >
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-[10px]">
                        <Bot className="h-3.5 w-3.5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white dark:bg-muted border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input ── */}
              <div className="shrink-0 px-3 py-3 bg-background border-t border-border/60">
                <div className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-xl px-1 py-1 focus-within:border-primary/40 focus-within:bg-background transition-colors">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message…"
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-[13px] h-9 px-2 placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className={cn(
                      'h-8 w-8 rounded-lg shrink-0 flex items-center justify-center transition-all',
                      inputValue.trim() && !isLoading
                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;