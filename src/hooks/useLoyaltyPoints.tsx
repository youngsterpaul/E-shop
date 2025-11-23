import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export const useLoyaltyPoints = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's points
  const { data: points, isLoading } = useQuery({
    queryKey: ['loyalty-points', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data || { points: 0, total_earned: 0, total_redeemed: 0 };
    },
    enabled: !!user
  });

  // Fetch points transactions
  const { data: transactions } = useQuery({
    queryKey: ['points-transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user's referral code
  const { data: referralCode } = useQuery({
    queryKey: ['referral-code', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if user already has a referral code
      const { data, error } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return data.referral_code;
      }

      // Generate new referral code
      const code = `REF${user.id.substring(0, 8).toUpperCase()}`;
      
      const { data: newReferral, error: insertError } = await supabase
        .from('referrals')
        .insert({
          referrer_user_id: user.id,
          referral_code: code
        })
        .select('referral_code')
        .single();

      if (insertError) throw insertError;
      return newReferral.referral_code;
    },
    enabled: !!user
  });

  // Fetch referral stats
  const { data: referralStats } = useQuery({
    queryKey: ['referral-stats', user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, completed: 0, pending: 0, points: 0 };

      const { data, error } = await supabase
        .from('referrals')
        .select('status, points_awarded')
        .eq('referrer_user_id', user.id);

      if (error) throw error;

      const stats = {
        total: data.length,
        completed: data.filter(r => r.status === 'completed').length,
        pending: data.filter(r => r.status === 'pending').length,
        points: data.reduce((sum, r) => sum + (r.points_awarded || 0), 0)
      };

      return stats;
    },
    enabled: !!user
  });

  return {
    points,
    transactions,
    referralCode,
    referralStats,
    isLoading
  };
};

export const useRewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available rewards
  const { data: rewards, isLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (error) throw error;
      return data;
    }
  });

  // Fetch user's redemptions
  const { data: redemptions } = useQuery({
    queryKey: ['reward-redemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          reward:rewards(*)
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Redeem reward mutation
  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      if (!user) throw new Error('Must be logged in to redeem rewards');

      // Get reward details
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .single();

      if (rewardError) throw rewardError;

      // Check if user has enough points
      const { data: userPoints, error: pointsError } = await supabase
        .from('loyalty_points')
        .select('points')
        .eq('user_id', user.id)
        .single();

      if (pointsError) throw pointsError;

      if (userPoints.points < reward.points_required) {
        throw new Error('Not enough points');
      }

      // Create redemption
      const voucherCode = `REWARD${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const { data, error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          points_spent: reward.points_required,
          voucher_code: voucherCode,
          expires_at: reward.valid_until
        })
        .select()
        .single();

      if (error) throw error;

      // Deduct points
      const { data: currentPoints } = await supabase
        .from('loyalty_points')
        .select('points, total_redeemed')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('loyalty_points')
        .update({
          points: userPoints.points - reward.points_required,
          total_redeemed: (currentPoints?.total_redeemed || 0) + reward.points_required
        })
        .eq('user_id', user.id);

      // Record transaction
      await supabase
        .from('points_transactions')
        .insert({
          user_id: user.id,
          points: -reward.points_required,
          transaction_type: 'redeem',
          source: 'reward_redemption',
          reference_id: data.id,
          description: `Redeemed reward: ${reward.name}`
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] });
      
      toast({
        title: "Reward redeemed!",
        description: "Your voucher code has been generated"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to redeem reward",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    rewards,
    redemptions,
    redeemReward: redeemMutation.mutate,
    isRedeeming: redeemMutation.isPending,
    isLoading
  };
};
