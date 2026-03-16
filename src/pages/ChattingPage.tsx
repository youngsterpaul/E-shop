import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Headphones, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { useUserUnreadChat } from "@/hooks/useUserUnreadChat";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const ChattingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, isLoading, isStreaming, sendMessage, requestAdmin, conversation } = useChat();
  const { markAsRead } = useUserUnreadChat();

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /* -----------------------------
     Dynamic viewport height fix
     Tracks the VISUAL viewport (shrinks when keyboard opens on mobile)
     ----------------------------- */
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--chat-vh", `${vh}px`);
    };

    updateViewportHeight();

    // visualViewport fires when keyboard appears/disappears
    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.visualViewport?.addEventListener("scroll", updateViewportHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
      window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
    };
  }, []);

  /* -----------------------------
     Mark messages as read
     ----------------------------- */
  useEffect(() => {
    markAsRead();
  }, [markAsRead, messages]);

  /* -----------------------------
     Auto scroll to latest message
     — uses the inner scrollable div, not window
     ----------------------------- */
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue("");
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* -----------------------------
     If user not logged in
     ----------------------------- */
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="bg-muted rounded-full p-6 mb-4">
          <Bot className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Sign in to Chat</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-[250px]">
          Access our 24/7 support by signing into your account.
        </p>
        <Button
          size="sm"
          onClick={() => navigate("/auth", { state: { redirectAfterAuth: "/chat" } })}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    /*
     * KEY FIX: The outer container uses --chat-vh (visual viewport height).
     * It is a flex column. The messages area is flex-1 + overflow-y-auto so it
     * fills the remaining space and scrolls internally. The input bar is a
     * normal (non-fixed) element at the bottom of the flex column.
     *
     * When the keyboard opens, --chat-vh shrinks → the whole container shrinks
     * → messages area scrolls within the reduced space → input stays pinned
     * at the bottom, right above the keyboard. Exactly like WhatsApp.
     */
    <div
      className="flex flex-col max-w-2xl mx-auto bg-background border rounded-xl overflow-hidden shadow-sm mb-4"
      style={{ height: "var(--chat-vh, 100dvh)" }}
    >

      {/* -----------------------------
          Messages Area — flex-1 + overflow-y-auto = self-scrolling
      ----------------------------- */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain pt-20 px-4 pb-2 bg-slate-50/30"
      >
        <div className="space-y-6">

          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 mb-4">
                <Bot className="h-6 w-6 text-primary/60" />
              </div>
              <h3 className="text-sm font-medium">Start a conversation</h3>
              <p className="text-[12px] text-muted-foreground mt-1">
                Ask about orders, products, or returns.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.sender_type === "user";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                {!isUser && (
                  <Avatar className="h-7 w-7 mt-0.5 border">
                    <AvatarFallback
                      className={cn(
                        "text-[10px]",
                        message.sender_type === "admin"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-blue-50 text-blue-600"
                      )}
                    >
                      {message.sender_type === "admin" ? (
                        <Headphones className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "flex flex-col gap-1.5 max-w-[85%]",
                    isUser ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2 shadow-sm text-[13px] leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none"
                        : "bg-white border rounded-2xl rounded-tl-none text-slate-700"
                    )}
                  >
                    {message.sender_type === "admin" && (
                      <div className="flex items-center gap-1 mb-1">
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1.5 py-0 uppercase bg-emerald-50/50 text-emerald-700 border-emerald-100"
                        >
                          Agent
                        </Badge>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  <span className="text-[10px] text-muted-foreground px-1">
                    {new Date(message.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {isUser && (
                  <Avatar className="h-7 w-7 mt-0.5 border">
                    <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px]">
                      <User className="h-3.5 w-3.5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex gap-2.5 justify-start">
              <Avatar className="h-7 w-7 border">
                <AvatarFallback className="bg-blue-50 text-blue-600">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border rounded-2xl rounded-tl-none px-4 py-3 flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]" />
              </div>
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* -----------------------------
          Footer Input — part of flex flow, NOT fixed
          Stays pinned at bottom automatically as the container shrinks
      ----------------------------- */}
      <div className="shrink-0 p-3 bg-background border-t">

        {conversation?.status === "active" && messages.length > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={requestAdmin}
            className="w-full h-8 text-[11px] font-medium text-primary hover:bg-primary/5 mb-3"
          >
            <Headphones className="h-3 w-3 mr-2" />
            Connect with a human agent
          </Button>
        )}

        <div className="flex gap-2 items-center bg-slate-100 rounded-xl px-3 py-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Write a message..."
            disabled={isLoading}
            className="border-0 bg-transparent focus-visible:ring-0 text-[13px] h-9 px-0"
          />

          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="h-8 w-8 rounded-lg shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default ChattingPage;