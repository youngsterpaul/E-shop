import { Award, TrendingUp, Gift, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export const LoyaltyPointsWidget = () => {
  const { points, referralStats, isLoading } = useLoyaltyPoints();
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

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Available Points</p>
            <p className="text-3xl font-bold text-primary">{points.points}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-semibold text-foreground">{points.total_earned}</p>
          </div>
        </div>

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
            onClick={() => navigate('/loyalty')}
          >
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
