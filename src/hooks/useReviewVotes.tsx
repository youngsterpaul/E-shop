import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReviewVote {
  vote_type: 'helpful' | 'not_helpful';
  user_id: string;
}

interface VoteCounts {
  helpful: number;
  not_helpful: number;
}

export const useReviewVotes = (reviewId: string) => {
  const [userVote, setUserVote] = useState<'helpful' | 'not_helpful' | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCounts>({ helpful: 0, not_helpful: 0 });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch vote counts and user's vote
  useEffect(() => {
    const fetchVoteData = async () => {
      try {
        // Get all votes for this review
        const { data: votes, error: votesError } = await supabase
          .from('review_votes')
          .select('vote_type, user_id')
          .eq('review_id', reviewId);

        if (votesError) throw votesError;

        // Calculate counts
        const counts = { helpful: 0, not_helpful: 0 };
        let currentUserVote: 'helpful' | 'not_helpful' | null = null;

        votes?.forEach((vote: any) => {
          const voteType = vote.vote_type as 'helpful' | 'not_helpful';
          if (voteType === 'helpful') counts.helpful++;
          if (voteType === 'not_helpful') counts.not_helpful++;
          
          if (user && vote.user_id === user.id) {
            currentUserVote = voteType;
          }
        });

        setVoteCounts(counts);
        setUserVote(currentUserVote);
      } catch (error) {
        console.error('Error fetching vote data:', error);
      }
    };

    fetchVoteData();
  }, [reviewId, user]);

  const submitVote = async (voteType: 'helpful' | 'not_helpful') => {
    if (!user) return;

    setLoading(true);
    
    try {
      if (userVote === voteType) {
        // Remove vote if clicking same button
        await supabase
          .from('review_votes')
          .delete()
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        setUserVote(null);
        setVoteCounts(prev => ({
          ...prev,
          [voteType]: Math.max(0, prev[voteType] - 1)
        }));
      } else if (userVote && userVote !== voteType) {
        // Update existing vote
        await supabase
          .from('review_votes')
          .update({ vote_type: voteType })
          .eq('review_id', reviewId)
          .eq('user_id', user.id);

        setUserVote(voteType);
        setVoteCounts(prev => ({
          helpful: voteType === 'helpful' ? prev.helpful + 1 : Math.max(0, prev.helpful - 1),
          not_helpful: voteType === 'not_helpful' ? prev.not_helpful + 1 : Math.max(0, prev.not_helpful - 1)
        }));
      } else {
        // Create new vote
        await supabase
          .from('review_votes')
          .insert({
            review_id: reviewId,
            user_id: user.id,
            vote_type: voteType
          });

        setUserVote(voteType);
        setVoteCounts(prev => ({
          ...prev,
          [voteType]: prev[voteType] + 1
        }));
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setLoading(false);
    }
  };

  // Return data in the format expected by the component
  return {
    voteData: {
      user_vote: userVote,
      helpful_count: voteCounts.helpful,
      not_helpful_count: voteCounts.not_helpful
    },
    vote: submitVote,  // Alias for submitVote
    isVoting: loading, // Alias for loading
    // Keep original names for backward compatibility
    userVote,
    voteCounts,
    loading,
    submitVote,
    canVote: !!user
  };
};