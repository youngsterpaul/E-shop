import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useState, useCallback, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { useMobileEnhancements } from '@/hooks/useMobileEnhancements';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false
}: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { haptic } = useMobileEnhancements();
  
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startY.current = e.touches[0].pageY;
    isPulling.current = true;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      isPulling.current = false;
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].pageY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, threshold * 1.5);
      setPullDistance(distance);
      
      if (distance >= threshold && pullDistance < threshold) {
        haptic('light');
      }
    }
  }, [threshold, pullDistance, isRefreshing, haptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current || isRefreshing) return;
    
    isPulling.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      haptic('medium');
      
      try {
        await onRefresh();
        haptic('success');
      } catch (error) {
        haptic('error');
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh, isRefreshing, haptic]);

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {showIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ 
              opacity: isRefreshing ? 1 : progress,
              y: isRefreshing ? 0 : Math.min(pullDistance - 40, 20)
            }}
            exit={{ opacity: 0, y: -40 }}
            className="absolute top-0 left-0 right-0 flex justify-center z-50 pt-4"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : progress * 360 }}
              transition={{ 
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: 'linear'
              }}
              className="bg-background border border-border rounded-full p-2 shadow-lg"
            >
              <RefreshCw 
                className={`h-5 w-5 ${isRefreshing ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{ y: isRefreshing ? 40 : pullDistance > 10 ? pullDistance * 0.3 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
