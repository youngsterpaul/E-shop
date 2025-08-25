
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import RealtimeChat from '@/components/chat/RealtimeChat';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import { Link } from 'react-router-dom';

const ChatPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) {
      navigate('/contact');
    }
  }, [user, navigate]);

  if (!isMobile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 pb-14">
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
        title="Customer Support"
        rightAction={
          <Link to="/faq">
            <Button variant="ghost" size="sm" className="p-2">
              FAQs
            </Button>
          </Link>
        }
      />
      )}
      
      <div className="flex-1 flex flex-col min-h-0">
        <RealtimeChat />
      </div>
      {<MobileNav />}
    </div>
  );
};

export default ChatPage;
