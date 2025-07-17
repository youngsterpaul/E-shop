import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import ChatIconWithBadge from './ChatIconWithBadge';
import RealtimeChat from './RealtimeChat';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = isMobileUserAgent();

  // Don't show floating button on mobile
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90"
        size="icon"
      >
        <ChatIconWithBadge size={20} className="text-white" />
      </Button>

      {/* Chat Area */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 z-50 w-80 h-96 shadow-xl border">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-medium text-sm">Customer Support</h3>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-5 w-5"
            >
              <X size={14} />
            </Button>
          </div>
          <div className="h-[calc(100%-52px)]">
            <RealtimeChat />
          </div>
        </Card>
      )}
    </>
  );
};

export default FloatingChatButton;