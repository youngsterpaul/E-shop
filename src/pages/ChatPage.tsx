
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
import { Link } from 'react-router-dom';

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
        rightAction={
          <Link to="/faqs">
            <Button variant="ghost" size="sm" className="p-2">
              FAQs
            </Button>
          </Link>
        }
      />
      
      <div className="flex-1 flex flex-col min-h-0">
        <RealtimeChat />
      </div>
    </div>
  );
};

export default ChatPage;
