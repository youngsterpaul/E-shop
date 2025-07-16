
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import RealtimeChat from '@/components/chat/RealtimeChat';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!user) {
      navigate('/contact');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isMobile && <Header />}
      <MobileHeader 
        title="Customer Support"
        backTo="/"
        rightAction={
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="p-2">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <RealtimeChat />
      </div>
      <MobileNav />
    </div>
  );
};

export default ChatPage;
