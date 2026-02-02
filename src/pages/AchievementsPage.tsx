import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Award, Trophy, Flame, Star, ChevronRight, Gift } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/hooks/useGamification';
import { AchievementBadge } from '@/components/gamification/AchievementBadge';
import { StreakDisplay } from '@/components/gamification/StreakDisplay';
import { MemberTierCard } from '@/components/gamification/MemberTierCard';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const AchievementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const {
    achievements,
    streak,
    tiers,
    userTier,
    isLoading,
    getNextTierProgress,
    getAchievementStatus,
    ACHIEVEMENTS
  } = useGamification();

  if (!user) {
    navigate('/auth/signin');
    return null;
  }

  const { progress, nextTier, pointsNeeded } = getNextTierProgress();
  const achievementStatus = getAchievementStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <MobileHeader title="Achievements" backTo="/account" />
        <main className={`max-w-[1200px] mx-auto px-4 lg:px-6 py-8 ${isMobile ? 'pt-20' : ''}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-64 lg:col-span-1" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </main>
      </div>
    );
  }

  const currentTier = userTier?.tier || tiers?.[0];
  const benefits = Array.isArray(currentTier?.benefits) 
    ? currentTier.benefits as string[]
    : typeof currentTier?.benefits === 'string'
      ? JSON.parse(currentTier.benefits)
      : [];

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader title="Achievements" backTo="/account" />
      <main className={`max-w-[1200px] mx-auto px-4 lg:px-6 py-8 ${isMobile ? 'pt-20' : ''}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Achievements & Status</h1>
          <p className="text-muted-foreground mt-2">Track your progress and unlock exclusive rewards</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Member Tier Card */}
          <div className="lg:col-span-1">
            {currentTier && (
              <MemberTierCard
                tierName={currentTier.tier_name}
                tierLevel={currentTier.tier_level}
                badgeColor={currentTier.badge_color}
                iconName={currentTier.icon_name}
                benefits={benefits}
                lifetimePoints={userTier?.lifetime_points || 0}
                nextTierProgress={progress}
                nextTierName={nextTier?.tier_name}
                pointsToNextTier={pointsNeeded}
                discountPercent={currentTier.discount_percent}
                prioritySupport={currentTier.priority_support}
                earlyAccess={currentTier.early_access}
              />
            )}

            {/* Quick Stats */}
            <Card className="mt-6 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Achievements Unlocked</p>
                    <p className="text-2xl font-bold text-foreground">
                      {achievementStatus.unlocked}/{achievementStatus.total}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <Progress value={achievementStatus.percentage} className="mt-3" />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="achievements" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
                <TabsTrigger value="streak">Streaks</TabsTrigger>
                <TabsTrigger value="tiers">All Tiers</TabsTrigger>
              </TabsList>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
                {/* Unlocked Achievements */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Unlocked Achievements
                    </CardTitle>
                    <CardDescription>Badges you've earned through your activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {achievements && achievements.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                        {achievements.map((achievement) => (
                          <AchievementBadge
                            key={achievement.id}
                            name={achievement.achievement_name}
                            description={achievement.achievement_description || ''}
                            icon={achievement.badge_icon || 'Award'}
                            points={achievement.points_awarded}
                            unlocked={true}
                            unlockedAt={achievement.unlocked_at}
                            size="md"
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-muted-foreground">Start shopping to unlock achievements!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Achievements */}
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-muted-foreground" />
                      Available Achievements
                    </CardTitle>
                    <CardDescription>Complete these actions to earn badges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                      {achievementStatus.available.map(([type, achievement]) => (
                        <AchievementBadge
                          key={type}
                          name={achievement.name}
                          description={achievement.description}
                          icon={achievement.icon}
                          points={achievement.points}
                          unlocked={false}
                          size="md"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Streak Tab */}
              <TabsContent value="streak">
                <StreakDisplay
                  currentStreak={streak?.current_streak || 0}
                  longestStreak={streak?.longest_streak || 0}
                  totalActiveDays={streak?.total_active_days || 0}
                />

                <Card className="mt-6 border-border/50">
                  <CardHeader>
                    <CardTitle>Streak Rewards</CardTitle>
                    <CardDescription>Earn bonus points by maintaining your streak</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { days: 3, points: 10, label: '3 Day Streak' },
                        { days: 7, points: 25, label: 'Week Warrior' },
                        { days: 14, points: 50, label: 'Fortnight Fighter' },
                        { days: 30, points: 100, label: 'Monthly Master' },
                      ].map((milestone) => (
                        <div 
                          key={milestone.days}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            (streak?.current_streak || 0) >= milestone.days 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Flame className={`h-5 w-5 ${
                              (streak?.current_streak || 0) >= milestone.days 
                                ? 'text-orange-500' 
                                : 'text-muted-foreground'
                            }`} />
                            <span className="font-medium text-foreground">{milestone.label}</span>
                          </div>
                          <Badge variant={(streak?.current_streak || 0) >= milestone.days ? "default" : "outline"}>
                            +{milestone.points} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tiers Tab */}
              <TabsContent value="tiers">
                <div className="space-y-4">
                  {tiers?.map((tier) => {
                    const isCurrentTier = tier.id === userTier?.tier_id;
                    const tierBenefits = Array.isArray(tier.benefits) 
                      ? tier.benefits as string[]
                      : typeof tier.benefits === 'string'
                        ? JSON.parse(tier.benefits)
                        : [];

                    return (
                      <Card 
                        key={tier.id} 
                        className={`border-2 transition-all ${
                          isCurrentTier ? 'border-primary shadow-lg' : 'border-border/50'
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div 
                                className="h-12 w-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: `${tier.badge_color}20` }}
                              >
                                <Award className="h-6 w-6" style={{ color: tier.badge_color }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg text-foreground">{tier.tier_name}</h3>
                                  {isCurrentTier && <Badge>Current</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {tier.min_points.toLocaleString()} - {tier.max_points ? tier.max_points.toLocaleString() : '∞'} points
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{tier.discount_percent}% Off</p>
                              <p className="text-xs text-muted-foreground">Member discount</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {tierBenefits.slice(0, 3).map((benefit: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {benefit}
                              </Badge>
                            ))}
                            {tierBenefits.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{tierBenefits.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* CTA to Rewards */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Redeem Your Points</h3>
                <p className="text-muted-foreground">Exchange points for discounts and rewards</p>
              </div>
            </div>
            <Button onClick={() => navigate('/rewards')} size="lg">
              View Rewards
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AchievementsPage;
