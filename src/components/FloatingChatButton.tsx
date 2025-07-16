
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isMobileUserAgent } from "@/hooks/use-mobile";

const FloatingChatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = isMobileUserAgent();

  return (
    <>
      {/* Desktop floating chat button */}
      {!isMobile && (
      <div className="fixed bottom-6 right-6 z-50 block">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 bg-orange-500 hover:bg-orange-600 shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
        
        {isOpen && (
          <div className="bg-white rounded-lg shadow-2xl border w-80 h-96 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Chat with Support</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )}
    </>
  );
};

export default FloatingChatButton;
