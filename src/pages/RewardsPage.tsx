import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Award, Ticket, TrendingUp } from 'lucide-react';
import { useRewards, useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const RewardsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { rewards, redemptions, redeemReward, isRedeeming, isLoading } = useRewards();
  const { points } = useLoyaltyPoints();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Ticket className="h-6 w-6" />;
      case 'free_shipping':
        return <TrendingUp className="h-6 w-6" />;
      case 'product':
        return <Gift className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const getRewardDescription = (reward: any) => {
    const value = reward.reward_value;
    switch (reward.reward_type) {
      case 'discount':
        return `${value.discount_percent}% off your next purchase`;
      case 'free_shipping':
        return `Free shipping on orders over KES ${value.min_order || 0}`;
      case 'voucher':
        return `KES ${value.amount} voucher`;
      default:
        return reward.description;
    }
  };

  const handleRedeem = (rewardId: string) => {
    setSelectedReward(rewardId);
    redeemReward(rewardId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Rewards Catalog</h1>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Your Points</p>
              <p className="text-2xl font-bold text-primary">{points?.points || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList>
            <TabsTrigger value="available">Available Rewards</TabsTrigger>
            <TabsTrigger value="redeemed">My Redemptions</TabsTrigger>
          </TabsList>

          {/* Available Rewards */}
          <TabsContent value="available" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rewards && rewards.length > 0 ? (
                rewards.map((reward) => {
                  const canAfford = (points?.points || 0) >= reward.points_required;
                  
                  return (
                    <Card key={reward.id} className={!canAfford ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            {getRewardIcon(reward.reward_type)}
                          </div>
                          <Badge variant={canAfford ? "default" : "secondary"}>
                            {reward.points_required} pts
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <CardDescription>{getRewardDescription(reward)}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          className="w-full"
                          disabled={!canAfford || isRedeeming || selectedReward === reward.id}
                          onClick={() => handleRedeem(reward.id)}
                        >
                          {isRedeeming && selectedReward === reward.id
                            ? 'Redeeming...'
                            : canAfford
                            ? 'Redeem Now'
                            : `Need ${reward.points_required - (points?.points || 0)} more points`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No rewards available</p>
                  <p className="text-muted-foreground">Check back later for new rewards</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Redemptions */}
          <TabsContent value="redeemed" className="space-y-4">
            {redemptions && redemptions.length > 0 ? (
              <div className="space-y-4">
                {redemptions.map((redemption: any) => (
                  <Card key={redemption.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{redemption.reward?.name}</h3>
                            <Badge variant={redemption.status === 'active' ? 'default' : 'secondary'}>
                              {redemption.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getRewardDescription(redemption.reward)}
                          </p>
                          {redemption.voucher_code && (
                            <div className="bg-muted p-3 rounded-md mt-3">
                              <p className="text-xs text-muted-foreground mb-1">Voucher Code</p>
                              <p className="font-mono font-bold text-lg">{redemption.voucher_code}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Redeemed {formatDistanceToNow(new Date(redemption.redeemed_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Points Used</p>
                          <p className="text-xl font-bold text-primary">-{redemption.points_spent}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No redemptions yet</p>
                  <p className="text-muted-foreground mb-4">Start redeeming rewards to see them here</p>
                  <Button onClick={() => navigate('/loyalty')}>Earn More Points</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RewardsPage;
