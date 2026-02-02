import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { useEffect } from 'react';

interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  achievement_name: string;
  achievement_description: string | null;
  badge_icon: string | null;
  points_awarded: number;
  unlocked_at: string;
  metadata: Record<string, unknown>;
}

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_type: string;
  total_active_days: number;
}

interface MemberTier {
  id: string;
  tier_name: string;
  tier_level: number;
  min_points: number;
  max_points: number | null;
  benefits: string[];
  badge_color: string;
  icon_name: string;
  discount_percent: number;
  free_shipping_threshold: number | null;
  priority_support: boolean;
  early_access: boolean;
}

interface UserTier {
  id: string;
  user_id: string;
  tier_id: string;
  lifetime_points: number;
  current_period_points: number;
  next_tier_progress: number;
  tier?: MemberTier;
}

// Achievement definitions
const ACHIEVEMENTS = {
  first_purchase: { name: 'First Purchase', description: 'Made your first purchase', icon: 'ShoppingBag', points: 50 },
  review_writer: { name: 'Review Writer', description: 'Wrote your first product review', icon: 'MessageSquare', points: 25 },
  loyal_customer: { name: 'Loyal Customer', description: 'Made 10 purchases', icon: 'Heart', points: 100 },
  big_spender: { name: 'Big Spender', description: 'Spent over KES 50,000 lifetime', icon: 'Wallet', points: 200 },
  streak_master: { name: 'Streak Master', description: 'Maintained a 7-day login streak', icon: 'Flame', points: 75 },
  social_butterfly: { name: 'Social Butterfly', description: 'Shared a wishlist with friends', icon: 'Share2', points: 30 },
  referral_champion: { name: 'Referral Champion', description: 'Referred 5 friends who made purchases', icon: 'Users', points: 150 },
  early_bird: { name: 'Early Bird', description: 'Made a purchase during a flash sale', icon: 'Clock', points: 40 },
  collector: { name: 'Collector', description: 'Added 20 items to wishlist', icon: 'Star', points: 20 },
  explorer: { name: 'Explorer', description: 'Browsed all product categories', icon: 'Compass', points: 15 },
};

export const useGamification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false });
      if (error) throw error;
      return data as Achievement[];
    },
    enabled: !!user
  });

  // Fetch user streak
  const { data: streak, isLoading: streakLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserStreak | null;
    },
    enabled: !!user
  });

  // Fetch all member tiers
  const { data: tiers } = useQuery({
    queryKey: ['member-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('member_tiers')
        .select('*')
        .order('tier_level', { ascending: true });
      if (error) throw error;
      return data as MemberTier[];
    }
  });

  // Fetch user's current tier
  const { data: userTier, isLoading: tierLoading } = useQuery({
    queryKey: ['user-tier', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_tiers')
        .select(`
          *,
          tier:member_tiers(*)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserTier | null;
    },
    enabled: !!user
  });

  // Update streak on page load
  useEffect(() => {
    if (user) {
      updateStreak();
    }
  }, [user?.id]);

  const updateStreak = async () => {
    if (!user) return;
    try {
      await supabase.rpc('update_user_streak', { p_user_id: user.id });
      queryClient.invalidateQueries({ queryKey: ['user-streak', user.id] });
    } catch (error) {
      console.error('Failed to update streak:', error);
    }
  };

  // Unlock achievement mutation
  const unlockAchievement = useMutation({
    mutationFn: async (achievementType: keyof typeof ACHIEVEMENTS) => {
      if (!user) throw new Error('Must be logged in');
      
      const achievement = ACHIEVEMENTS[achievementType];
      if (!achievement) throw new Error('Invalid achievement type');

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_type: achievementType,
          achievement_name: achievement.name,
          achievement_description: achievement.description,
          badge_icon: achievement.icon,
          points_awarded: achievement.points
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') return null; // Already unlocked
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        queryClient.invalidateQueries({ queryKey: ['loyalty-points'] });
        
        toast({
          title: "🏆 Achievement Unlocked!",
          description: `${data.achievement_name} - +${data.points_awarded} points`,
        });
      }
    }
  });

  // Calculate progress to next tier
  const getNextTierProgress = () => {
    if (!userTier || !tiers) return { progress: 0, nextTier: null, pointsNeeded: 0 };
    
    const currentTierLevel = userTier.tier?.tier_level || 1;
    const nextTier = tiers.find(t => t.tier_level === currentTierLevel + 1);
    
    if (!nextTier) return { progress: 100, nextTier: null, pointsNeeded: 0 };
    
    const pointsNeeded = nextTier.min_points - userTier.lifetime_points;
    const currentTierMin = userTier.tier?.min_points || 0;
    const range = nextTier.min_points - currentTierMin;
    const progress = Math.min(100, ((userTier.lifetime_points - currentTierMin) / range) * 100);
    
    return { progress, nextTier, pointsNeeded: Math.max(0, pointsNeeded) };
  };

  // Get achievement status
  const getAchievementStatus = () => {
    const unlockedTypes = new Set(achievements?.map(a => a.achievement_type) || []);
    const total = Object.keys(ACHIEVEMENTS).length;
    const unlocked = unlockedTypes.size;
    
    return {
      total,
      unlocked,
      percentage: Math.round((unlocked / total) * 100),
      available: Object.entries(ACHIEVEMENTS).filter(([type]) => !unlockedTypes.has(type))
    };
  };

  return {
    achievements,
    streak,
    tiers,
    userTier,
    isLoading: achievementsLoading || streakLoading || tierLoading,
    unlockAchievement: unlockAchievement.mutate,
    getNextTierProgress,
    getAchievementStatus,
    ACHIEVEMENTS
  };
};
