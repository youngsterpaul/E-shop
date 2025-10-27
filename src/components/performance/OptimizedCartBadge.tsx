<<<<<<< HEAD

import { memo, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OptimizedCartBadgeProps {
  totalItems: number;
  onClick?: () => void;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OptimizedCartBadge = memo(({ 
  totalItems, 
  onClick, 
  showText = false, 
  size = 'md' 
}: OptimizedCartBadgeProps) => {
  const [displayCount, setDisplayCount] = useState(totalItems);
  const [isAnimating, setIsAnimating] = useState(false);

  // Smooth count animation
  useEffect(() => {
    if (totalItems !== displayCount) {
      setIsAnimating(true);
      
      const startCount = displayCount;
      const difference = totalItems - startCount;
      const duration = 300;
      const steps = 20;
      const stepValue = difference / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newCount = Math.round(startCount + (stepValue * currentStep));
        
        if (currentStep >= steps) {
          setDisplayCount(totalItems);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(newCount);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [totalItems, displayCount]);

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];

  const buttonSize = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  }[size] as 'sm' | 'default' | 'lg';

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={onClick}
      className={`relative transition-all duration-200 hover:scale-105 ${
        isAnimating ? 'animate-pulse' : ''
      }`}
    >
      <div className="relative">
        <ShoppingCart size={iconSize} />
        {displayCount > 0 && (
          <Badge 
            variant="destructive" 
            className={`
              absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs
              transition-all duration-300 ease-in-out
              ${isAnimating ? 'scale-125 animate-bounce' : 'scale-100'}
            `}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
        
        {/* Pulse animation for updates */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"></div>
        )}
      </div>
      
      {showText && (
        <span className="ml-2 hidden sm:inline">
          Cart {displayCount > 0 && `(${displayCount})`}
        </span>
      )}
    </Button>
  );
});

OptimizedCartBadge.displayName = 'OptimizedCartBadge';

export default OptimizedCartBadge;
=======

import { memo, useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OptimizedCartBadgeProps {
  totalItems: number;
  onClick?: () => void;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OptimizedCartBadge = memo(({ 
  totalItems, 
  onClick, 
  showText = false, 
  size = 'md' 
}: OptimizedCartBadgeProps) => {
  const [displayCount, setDisplayCount] = useState(totalItems);
  const [isAnimating, setIsAnimating] = useState(false);

  // Smooth count animation
  useEffect(() => {
    if (totalItems !== displayCount) {
      setIsAnimating(true);
      
      const startCount = displayCount;
      const difference = totalItems - startCount;
      const duration = 300;
      const steps = 20;
      const stepValue = difference / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newCount = Math.round(startCount + (stepValue * currentStep));
        
        if (currentStep >= steps) {
          setDisplayCount(totalItems);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(newCount);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [totalItems, displayCount]);

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  }[size];

  const buttonSize = {
    sm: 'sm',
    md: 'default',
    lg: 'lg'
  }[size] as 'sm' | 'default' | 'lg';

  return (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={onClick}
      className={`relative transition-all duration-200 hover:scale-105 ${
        isAnimating ? 'animate-pulse' : ''
      }`}
    >
      <div className="relative">
        <ShoppingCart size={iconSize} />
        {displayCount > 0 && (
          <Badge 
            variant="destructive" 
            className={`
              absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs
              transition-all duration-300 ease-in-out
              ${isAnimating ? 'scale-125 animate-bounce' : 'scale-100'}
            `}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
        
        {/* Pulse animation for updates */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping"></div>
        )}
      </div>
      
      {showText && (
        <span className="ml-2 hidden sm:inline">
          Cart {displayCount > 0 && `(${displayCount})`}
        </span>
      )}
    </Button>
  );
});

OptimizedCartBadge.displayName = 'OptimizedCartBadge';

export default OptimizedCartBadge;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
