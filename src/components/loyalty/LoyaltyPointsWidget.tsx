import { Award, TrendingUp, Gift, Users, Flame, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useGamification } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const LoyaltyPointsWidget = () => {
  const { points, referralStats, isLoading } = useLoyaltyPoints();
  const { streak, userTier, getNextTierProgress } = useGamification();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!points) return null;

  const tierProgress = getNextTierProgress();
  const currentTierName = userTier?.tier?.tier_name || 'Bronze';

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Loyalty Points
          </CardTitle>
          {streak && streak.current_streak > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak.current_streak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Display */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-3xl font-bold text-primary">{points.points}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Member Status</p>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="font-semibold text-foreground">{currentTierName}</span>
            </div>
          </div>
        </div>

        {/* Tier Progress */}
        {tierProgress.nextTier && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress to {tierProgress.nextTier.tier_name}</span>
              <span className="font-medium">{Math.round(tierProgress.progress)}%</span>
            </div>
            <Progress value={tierProgress.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {tierProgress.pointsNeeded.toLocaleString()} points to next tier
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>{points.total_earned} earned</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Gift className="h-4 w-4 text-purple-600" />
            <span>{points.total_redeemed} redeemed</span>
          </div>
        </div>

        {referralStats && referralStats.completed > 0 && (
          <div className="flex items-center gap-2 text-sm bg-background/50 rounded-lg p-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span>{referralStats.completed} successful referrals</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => navigate('/rewards')}
          >
            View Rewards
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/achievements')}
          >
            Achievements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
