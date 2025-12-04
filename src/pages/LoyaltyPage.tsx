import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, TrendingUp, Gift, Users, Copy, Check } from 'lucide-react';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

const LoyaltyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { points, transactions, referralCode, referralStats } = useLoyaltyPoints();
  const [copiedCode, setCopiedCode] = useState(false);

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  const handleCopyReferralCode = () => {
    if (referralCode) {
      const referralUrl = `${window.location.origin}/auth/signup?ref=${referralCode}`;
      navigator.clipboard.writeText(referralUrl);
      setCopiedCode(true);
      toast({
        title: "Referral link copied!",
        description: "Share it with friends to earn rewards"
      });
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-4 lg:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Loyalty & Rewards</h1>
          <p className="text-muted-foreground mt-2">Earn points with every purchase and redeem for rewards</p>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-bold text-primary">{points?.points || 0}</span>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">{points?.total_earned || 0}</span>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">{referralStats?.completed || 0}</span>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="earn" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="earn">Earn Points</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="referral">Referral Program</TabsTrigger>
          </TabsList>

          {/* Earn Points */}
          <TabsContent value="earn" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Ways to Earn Points</CardTitle>
                <CardDescription>Complete these actions to earn loyalty points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Make a Purchase</p>
                      <p className="text-sm text-muted-foreground">Earn 1 point per KES 100 spent</p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/')}>Shop Now</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Write a Review</p>
                      <p className="text-sm text-muted-foreground">Earn 10 points for each product review</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate('/orders')}>My Orders</Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Refer a Friend</p>
                      <p className="text-sm text-muted-foreground">Earn 50 points when they make their first purchase</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => { const tab = 'referral'; navigate(`/loyalty?tab=${tab}`); }}>Share Link</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Points History</CardTitle>
                <CardDescription>Your recent points transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions && transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-border/50 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.created_at && formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.points > 0 ? '+' : ''}{transaction.points}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {transaction.transaction_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No transactions yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referral Program */}
          <TabsContent value="referral" className="space-y-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Invite friends and earn rewards together</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-xl space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Your Referral Link</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/auth/signup?ref=${referralCode || ''}`}
                        readOnly
                        className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-sm"
                      />
                      <Button onClick={handleCopyReferralCode} size="icon" className="shrink-0">
                        {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-primary">{referralStats?.pending || 0}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{referralStats?.completed || 0}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">How it works</h4>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">1.</span>
                      Share your unique referral link with friends
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">2.</span>
                      They sign up and make their first purchase
                    </li>
                    <li className="flex gap-3">
                      <span className="font-semibold text-primary">3.</span>
                      You both earn 50 loyalty points!
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA to rewards page */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Ready to Redeem?</h3>
              <p className="text-muted-foreground">Browse available rewards and redeem your points</p>
            </div>
            <Button onClick={() => navigate('/rewards')} size="lg">
              View Rewards
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LoyaltyPage;
