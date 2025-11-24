import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, ShoppingBag, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useReviewVotes } from '@/hooks/useReviewVotes';
import { useAuth } from '@/hooks/useAuth';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useUserRole } from '@/hooks/useUserRole';

interface Review {
  review_id: string;
  username: string;
  rating: number;
  comment: string;
  created_at: string | null;
  media_urls?: string[] | null;
  verified_purchase?: boolean | null;
  helpful_count?: number | null;
  review_replies?: Array<{
    id: string;
    reply_text: string;
    created_at: string | null;
    user_id: string;
    updated_at?: string | null;
  }>;
}

export const ReviewCard = ({ review }: { review: Review }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isModerator } = useUserRole(user?.id || '');
  const { voteStats, userVote, vote, isVoting } = useReviewVotes(review.review_id);
  
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyText, setEditReplyText] = useState('');

  const canReply = isAdmin || isModerator;

  const handleReply = async () => {
    if (!user || !replyText.trim()) return;

    setIsSubmittingReply(true);
    try {
      const { error } = await supabase
        .from('review_replies')
        .insert({
          review_id: review.review_id,
          user_id: user.id,
          reply_text: replyText.trim()
        });

      if (error) throw error;

      toast({
        title: "Reply posted",
        description: "Your reply has been added to the review"
      });

      setReplyText('');
      setShowReplyBox(false);
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
    } catch (error: any) {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleEditReply = async (replyId: string) => {
    if (!editReplyText.trim()) return;

    try {
      const { error } = await supabase
        .from('review_replies')
        .update({ reply_text: editReplyText.trim() })
        .eq('id', replyId);

      if (error) throw error;

      toast({
        title: "Reply updated",
        description: "Your reply has been updated successfully"
      });

      setEditingReplyId(null);
      setEditReplyText('');
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
    } catch (error: any) {
      toast({
        title: "Failed to update reply",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="border-b pb-6 last:border-0">
      <div className="flex items-start gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {review.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{review.username}</span>
            {review.verified_purchase && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ShoppingBag className="h-3 w-3" />
                Verified Purchase
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {review.created_at && formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>

          {review.media_urls && review.media_urls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {review.media_urls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Review ${idx + 1}`}
                  className="rounded-lg object-cover aspect-square cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => vote('helpful')}
                disabled={!user || isVoting}
                className={`h-8 gap-1 ${userVote === 'helpful' ? 'text-primary' : ''}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span className="text-xs">
                  Helpful {voteStats && voteStats.helpful > 0 ? `(${voteStats.helpful})` : ''}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => vote('not_helpful')}
                disabled={!user || isVoting}
                className={`h-8 gap-1 ${userVote === 'not_helpful' ? 'text-destructive' : ''}`}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="h-8 gap-1"
              >
                <Reply className="h-4 w-4" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>

          {showReplyBox && canReply && (
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                >
                  Post Reply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowReplyBox(false);
                    setReplyText('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {review.review_replies && review.review_replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-primary/20 space-y-3">
              {review.review_replies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Store Response</Badge>
                      <span className="text-xs text-muted-foreground">
                        {reply.created_at && formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {canReply && user?.id === reply.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingReplyId(reply.id);
                          setEditReplyText(reply.reply_text);
                        }}
                        className="h-6 text-xs"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingReplyId === reply.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        placeholder="Edit your reply..."
                        rows={3}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditReply(reply.id)}
                          disabled={!editReplyText.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingReplyId(null);
                            setEditReplyText('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-foreground">{reply.reply_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
