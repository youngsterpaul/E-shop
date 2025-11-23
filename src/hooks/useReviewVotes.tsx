import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export const useReviewVotes = (reviewId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vote counts
  const { data: voteStats } = useQuery({
    queryKey: ['review-votes', reviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('review_votes')
        .select('vote_type')
        .eq('review_id', reviewId);

      if (error) throw error;

      const helpful = data?.filter(v => v.vote_type === 'helpful').length || 0;
      const notHelpful = data?.filter(v => v.vote_type === 'not_helpful').length || 0;

      return { helpful, notHelpful, total: helpful + notHelpful };
    },
    enabled: !!reviewId
  });

  // Fetch user's vote
  const { data: userVote } = useQuery({
    queryKey: ['user-review-vote', reviewId, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('review_votes')
        .select('vote_type')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.vote_type || null;
    },
    enabled: !!reviewId && !!user
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (voteType: 'helpful' | 'not_helpful') => {
      if (!user) throw new Error('Must be logged in to vote');

      // Check if user already voted
      const { data: existing } = await supabase
        .from('review_votes')
        .select('id, vote_type')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // If same vote, remove it
        if (existing.vote_type === voteType) {
          const { error } = await supabase
            .from('review_votes')
            .delete()
            .eq('id', existing.id);
          
          if (error) throw error;
          return null;
        } else {
          // Update to new vote
          const { error } = await supabase
            .from('review_votes')
            .update({ vote_type: voteType })
            .eq('id', existing.id);
          
          if (error) throw error;
          return voteType;
        }
      } else {
        // Create new vote
        const { error } = await supabase
          .from('review_votes')
          .insert({ review_id: reviewId, user_id: user.id, vote_type: voteType });
        
        if (error) throw error;
        return voteType;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-votes', reviewId] });
      queryClient.invalidateQueries({ queryKey: ['user-review-vote', reviewId, user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to vote",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    voteStats,
    userVote,
    vote: voteMutation.mutate,
    isVoting: voteMutation.isPending
  };
};
