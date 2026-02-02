import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementBadgeProps {
  name: string;
  description?: string;
  icon: string;
  points: number;
  unlocked?: boolean;
  unlockedAt?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const AchievementBadge = ({
  name,
  description,
  icon,
  points,
  unlocked = false,
  unlockedAt,
  size = 'md',
  showTooltip = true
}: AchievementBadgeProps) => {
  const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Award;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20'
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9'
  };

  return (
    <div className="group relative flex flex-col items-center">
      <motion.div
        initial={unlocked ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center transition-all duration-300',
          unlocked
            ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30'
            : 'bg-muted/50 grayscale opacity-50'
        )}
      >
        <IconComponent className={cn(iconSizes[size], unlocked ? 'text-white' : 'text-muted-foreground')} />
        
        {unlocked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          >
            +{points}
          </motion.div>
        )}
      </motion.div>

      <p className={cn(
        'mt-2 text-center font-medium truncate max-w-[80px]',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        unlocked ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {name}
      </p>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-popover text-popover-foreground text-xs p-3 rounded-lg shadow-lg border border-border min-w-[160px]">
            <p className="font-semibold">{name}</p>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
            {unlocked && unlockedAt && (
              <p className="text-muted-foreground mt-1 text-[10px]">
                Unlocked {new Date(unlockedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
