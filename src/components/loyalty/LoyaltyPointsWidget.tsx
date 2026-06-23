import { Award, TrendingUp, Gift, Users, Flame, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useGamification } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const GemFashionStyleWidget = () => {
  const { points, referralStats, isLoading } = useLoyaltyPoints();
  const { streak, userTier, getNextTierProgress } = useGamification();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card className="border-rose-100 dark:border-rose-950">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-rose-100/50 dark:bg-rose-900/20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full bg-rose-100/50 dark:bg-rose-900/20" />
        </CardContent>
      </Card>
    );
  }

  if (!points) return null;

  const tierProgress = getNextTierProgress();
  const currentTierName = userTier?.tier?.tier_name || 'Bronze';

  return (
    <Card className="bg-gradient-to-br from-rose-50 to-amber-50/50 dark:from-stone-900 dark:to-rose-950/20 border-rose-100 dark:border-rose-900/40 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-stone-800 dark:text-stone-100 font-serif text-xl tracking-wide">
            <Award className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            Gem Fashion Style
          </CardTitle>
          {streak && streak.current_streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-rose-100 text-rose-700 hover:bg-rose-100 border-none dark:bg-rose-950/60 dark:text-rose-300">
              <Flame className="h-3 w-3 text-rose-500 fill-rose-500" />
              {streak.current_streak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Display */}
        <div className="grid grid-cols-2 gap-4 bg-white/60 dark:bg-stone-900/40 rounded-xl p-3 border border-stone-100 dark:border-stone-800">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">Available Points</p>
            <p className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight">{points.points}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400">Member Status</p>
            <div className="flex items-center gap-1.5 pt-1">
              <Trophy className="h-4 w-4 text-amber-500 fill-amber-100 dark:fill-none" />
              <span className="font-semibold text-stone-800 dark:text-stone-200 text-sm tracking-wide">{currentTierName}</span>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {tierProgress.nextTier && (
          <div className="space-y-2 bg-white/40 dark:bg-stone-900/20 rounded-xl p-3 border border-stone-100/50 dark:border-stone-800/50">
            <div className="flex justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-400">Progress to {tierProgress.nextTier.tier_name}</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">{Math.round(tierProgress.progress)}%</span>
            </div>
            <Progress value={tierProgress.progress} className="h-1.5 bg-stone-100 dark:bg-stone-800" indicatorClassName="bg-rose-500" />
            <p className="text-xs text-stone-500 dark:text-stone-400 italic">
              {tierProgress.pointsNeeded.toLocaleString()} points to next tier
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span>{points.total_earned} earned</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40">
              <Gift className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span>{points.total_redeemed} redeemed</span>
          </div>
        </div>

        {referralStats && referralStats.completed > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300 bg-stone-100/70 dark:bg-stone-900/60 rounded-lg p-2 border border-stone-200/40 dark:border-stone-800/40">
            <Users className="h-3.5 w-3.5 text-stone-500" />
            <span>{referralStats.completed} successful referrals</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button 
            size="sm" 
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors dark:bg-rose-700 dark:hover:bg-rose-600"
            onClick={() => navigate('/rewards')}
          >
            View Rewards
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1 border-stone-200 text-stone-700 hover:bg-stone-50 hover:text-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
            onClick={() => navigate('/achievements')}
          >
            Achievements
          </Button>
        </div>
      </CardContent> {/* Properly close CardContent first */}
    </Card>          {/* Then close Card */}
  );
};