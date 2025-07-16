
import { MessageCircle } from 'lucide-react';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useAuth } from '@/hooks/useAuth';

interface ChatIconWithBadgeProps {
  size?: number;
  className?: string;
}

const ChatIconWithBadge = ({ size = 24, className = "" }: ChatIconWithBadgeProps) => {
  const { unreadCount } = useUnreadMessages();
  const { user } = useAuth();

  if (!user) {
    return <MessageCircle size={size} className={className} />;
  }

  return (
    <div className="relative">
      <MessageCircle size={size} className={className} />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </div>
  );
};

export default ChatIconWithBadge;
