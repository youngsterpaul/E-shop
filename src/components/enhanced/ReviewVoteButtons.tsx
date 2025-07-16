
import { memo } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReviewVotes } from '@/hooks/useReviewVotes';
import { cn } from '@/lib/utils';

interface ReviewVoteButtonsProps {
  reviewId: string;
  className?: string;
}

const ReviewVoteButtons = memo(({ reviewId, className }: ReviewVoteButtonsProps) => {
  const { voteData, vote, isVoting } = useReviewVotes(reviewId);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => vote('helpful')}
        disabled={isVoting}
        className={cn(
          "flex items-center gap-1 text-xs transition-all duration-200",
          voteData.user_vote === 'helpful' 
            ? "bg-green-100 text-green-700 hover:bg-green-200" 
            : "hover:bg-gray-100"
        )}
      >
        <ThumbsUp 
          className={cn(
            "h-3 w-3 transition-all duration-200",
            voteData.user_vote === 'helpful' ? "fill-current scale-110" : ""
          )} 
        />
        <span className="font-medium">
          Helpful {voteData.helpful_count > 0 && `(${voteData.helpful_count})`}
        </span>
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => vote('not_helpful')}
        disabled={isVoting}
        className={cn(
          "flex items-center gap-1 text-xs transition-all duration-200",
          voteData.user_vote === 'not_helpful' 
            ? "bg-red-100 text-red-700 hover:bg-red-200" 
            : "hover:bg-gray-100"
        )}
      >
        <ThumbsDown 
          className={cn(
            "h-3 w-3 transition-all duration-200",
            voteData.user_vote === 'not_helpful' ? "fill-current scale-110" : ""
          )} 
        />
        <span className="font-medium">
          Not Helpful {voteData.not_helpful_count > 0 && `(${voteData.not_helpful_count})`}
        </span>
      </Button>
    </div>
  );
});

ReviewVoteButtons.displayName = 'ReviewVoteButtons';

export default ReviewVoteButtons;
