import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, BadgeCheck, Reply } from 'lucide-react';
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
    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-8 pt-2 last:border-0 transition-all duration-200">
      <div className="flex items-start gap-4">
        <Avatar className="h-11 w-11 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <AvatarFallback className="bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-medium text-xs tracking-wider">
            {review.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-zinc-950 dark:text-zinc-50 text-sm tracking-tight">{review.username}</span>
            {review.verified_purchase && (
              <Badge className="text-[11px] font-medium tracking-wide gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/50 rounded-md px-2 py-0.5">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Verified Purchase
              </Badge>
            )}
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-light">
              {review.created_at && formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${
                  i < review.rating
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-zinc-200 dark:text-zinc-700'
                }`}
              />
            ))}
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">{review.comment}</p>

          {review.media_urls && review.media_urls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 mt-4">
              {review.media_urls.map((url, idx) => (
                <div key={idx} className="overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800 shadow-sm aspect-square bg-zinc-50 dark:bg-zinc-900">
                  <img
                    src={url}
                    alt={`Review ${idx + 1}`}
                    className="object-cover w-full h-full cursor-pointer hover:scale-105 opacity-95 hover:opacity-100 transition-all duration-300 ease-out"
                    onClick={() => window.open(url, '_blank')}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900/60 p-0.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => vote('helpful')}
                disabled={!user || isVoting}
                className={`h-7 px-2.5 gap-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${userVote === 'helpful' ? 'text-amber-600 dark:text-amber-500 bg-white dark:bg-zinc-800 shadow-sm font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span className="text-[11px]">
                  Helpful {voteStats && voteStats.helpful > 0 ? `(${voteStats.helpful})` : ''}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => vote('not_helpful')}
                disabled={!user || isVoting}
                className={`h-7 px-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${userVote === 'not_helpful' ? 'text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-800 shadow-sm' : 'text-zinc-400'}`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReplyBox(!showReplyBox)}
                className="h-8 px-3 gap-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                <Reply className="h-3.5 w-3.5" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>

          {showReplyBox && canReply && (
            <div className="mt-4 space-y-2.5 max-w-xl bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write an elegant store reply..."
                rows={3}
                className="resize-none text-sm bg-white dark:bg-zinc-950 border-zinc-200 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:focus-visible:ring-zinc-700"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyText.trim() || isSubmittingReply}
                  className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs px-3 h-8 font-medium rounded-lg shadow-sm"
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
                  className="text-xs px-3 h-8 rounded-lg border-zinc-200 dark:border-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {review.review_replies && review.review_replies.length > 0 && (
            <div className="mt-5 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-4">
              {review.review_replies.map((reply) => (
                <div key={reply.id} className="space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/20 p-3 rounded-r-xl border-y border-r border-zinc-100/50 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] tracking-wide uppercase font-semibold bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 border-zinc-300 dark:border-zinc-700">
                        Gem Fashion Style Response
                      </Badge>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-light">
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
                        className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingReplyId === reply.id ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        placeholder="Edit your response..."
                        rows={3}
                        className="resize-none text-sm bg-white dark:bg-zinc-950 border-zinc-200 focus-visible:ring-zinc-400 dark:border-zinc-800"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          onClick={() => handleEditReply(reply.id)}
                          disabled={!editReplyText.trim()}
                          className="bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 text-xs px-3 h-8 rounded-lg"
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
                          className="text-xs px-3 h-8 rounded-lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal pl-0.5">{reply.reply_text}</p>
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