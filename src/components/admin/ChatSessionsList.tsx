
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageCircle, Clock } from 'lucide-react';
import { ChatSession } from '@/hooks/useAdminChatSessions';

interface ChatSessionsListProps {
  chatSessions: ChatSession[];
  selectedUserId: string | null;
  onSelectUser: (userId: string) => void;
}

const ChatSessionsList = ({ chatSessions, selectedUserId, onSelectUser }: ChatSessionsListProps) => {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle size={20} />
          Active Chats
          {chatSessions.some(s => s.unread_count > 0) && (
            <Bell className="text-red-500" size={16} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {chatSessions.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No chat sessions yet
            </div>
          ) : (
            chatSessions.map((session) => (
              <div
                key={session.user_id}
                onClick={() => onSelectUser(session.user_id)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUserId === session.user_id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-sm">
                      {session.user_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">{session.user_email}</p>
                  </div>
                  {session.unread_count > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {session.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate mb-1">
                  {session.last_message}
                </p>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {new Date(session.last_message_time).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatSessionsList;
