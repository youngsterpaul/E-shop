import { useEffect } from 'react';
import RealtimeChat from '@/components/chat/RealtimeChat';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const ChatPage = () => {
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!isMobile) {
      window.location.href = '/';
    }
  }, []);

  return (
    <RealtimeChat />
  );
};

export default ChatPage;