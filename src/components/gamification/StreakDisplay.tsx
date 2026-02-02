import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  variant?: 'compact' | 'full';
}

export const StreakDisplay = ({
  currentStreak,
  longestStreak,
  totalActiveDays,
  variant = 'full'
}: StreakDisplayProps) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-purple-500 to-pink-500';
    if (streak >= 14) return 'from-orange-500 to-red-500';
    if (streak >= 7) return 'from-yellow-500 to-orange-500';
    if (streak >= 3) return 'from-green-500 to-emerald-500';
    return 'from-primary to-primary';
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '⭐';
    return '✨';
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-medium text-sm',
          `bg-gradient-to-r ${getStreakColor(currentStreak)}`
        )}
      >
        <Flame className="w-4 h-4" />
        <span>{currentStreak} day streak</span>
      </motion.div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-lg text-foreground">Your Streak</h3>
        <span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Current Streak */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <div className={cn(
            'w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2',
            `bg-gradient-to-br ${getStreakColor(currentStreak)}`
          )}>
            <Flame className="w-8 h-8 text-white" />
          </div>
          <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </motion.div>

        {/* Longest Streak */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Longest Streak</p>
        </motion.div>

        {/* Total Active Days */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-2">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalActiveDays}</p>
          <p className="text-xs text-muted-foreground">Active Days</p>
        </motion.div>
      </div>

      {currentStreak > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-4"
        >
          Keep it up! Come back tomorrow to continue your streak.
        </motion.p>
      )}
    </div>
  );
};
