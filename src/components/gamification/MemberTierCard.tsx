import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface MemberTierCardProps {
  tierName: string;
  tierLevel: number;
  badgeColor: string;
  iconName: string;
  benefits: string[];
  lifetimePoints: number;
  nextTierProgress: number;
  nextTierName?: string;
  pointsToNextTier?: number;
  discountPercent: number;
  prioritySupport: boolean;
  earlyAccess: boolean;
}

export const MemberTierCard = ({
  tierName,
  tierLevel,
  badgeColor,
  iconName,
  benefits,
  lifetimePoints,
  nextTierProgress,
  nextTierName,
  pointsToNextTier,
  discountPercent,
  prioritySupport,
  earlyAccess
}: MemberTierCardProps) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Award;

  const tierGradients: Record<string, string> = {
    Bronze: 'from-amber-700 to-amber-900',
    Silver: 'from-gray-300 to-gray-500',
    Gold: 'from-yellow-400 to-amber-500',
    Platinum: 'from-gray-100 to-gray-300'
  };

  const tierTextColors: Record<string, string> = {
    Bronze: 'text-amber-100',
    Silver: 'text-gray-900',
    Gold: 'text-amber-900',
    Platinum: 'text-gray-800'
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Main Card */}
      <div className={cn(
        'p-6 bg-gradient-to-br',
        tierGradients[tierName] || 'from-primary to-primary/80'
      )}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <IconComponent className={cn('w-6 h-6', tierTextColors[tierName] || 'text-white')} />
              </div>
              <div>
                <p className={cn('text-sm opacity-80', tierTextColors[tierName] || 'text-white')}>Member Status</p>
                <h3 className={cn('text-2xl font-bold', tierTextColors[tierName] || 'text-white')}>{tierName}</h3>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-white/20 text-white border-0 hover:bg-white/30"
            >
              Level {tierLevel}
            </Badge>
          </div>

          {/* Points */}
          <div className="mb-4">
            <p className={cn('text-sm opacity-80', tierTextColors[tierName] || 'text-white')}>Lifetime Points</p>
            <p className={cn('text-3xl font-bold', tierTextColors[tierName] || 'text-white')}>
              {lifetimePoints.toLocaleString()}
            </p>
          </div>

          {/* Progress to next tier */}
          {nextTierName && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className={cn('opacity-80', tierTextColors[tierName] || 'text-white')}>
                  Progress to {nextTierName}
                </span>
                <span className={cn('font-medium', tierTextColors[tierName] || 'text-white')}>
                  {Math.round(nextTierProgress)}%
                </span>
              </div>
              <Progress 
                value={nextTierProgress} 
                className="h-2 bg-white/20"
              />
              {pointsToNextTier && pointsToNextTier > 0 && (
                <p className={cn('text-xs mt-1 opacity-70', tierTextColors[tierName] || 'text-white')}>
                  {pointsToNextTier.toLocaleString()} points to {nextTierName}
                </p>
              )}
            </div>
          )}

          {/* Key Benefits */}
          <div className="flex flex-wrap gap-2">
            {discountPercent > 0 && (
              <Badge className="bg-white/20 text-white border-0">
                {discountPercent}% Off
              </Badge>
            )}
            {prioritySupport && (
              <Badge className="bg-white/20 text-white border-0">
                Priority Support
              </Badge>
            )}
            {earlyAccess && (
              <Badge className="bg-white/20 text-white border-0">
                Early Access
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Benefits List */}
      <div className="bg-card border border-border border-t-0 rounded-b-2xl p-4">
        <p className="text-sm font-medium text-foreground mb-3">Your Benefits</p>
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};
