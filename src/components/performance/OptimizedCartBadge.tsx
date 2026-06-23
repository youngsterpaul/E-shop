import { memo, useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react'; // Switched to ShoppingBag for a more high-end fashion boutique feel
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GemFashionCartBadgeProps {
  totalItems: number;
  onClick?: () => void;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GemFashionCartBadge = memo(({ 
  totalItems, 
  onClick, 
  showText = false, 
  size = 'md' 
}: GemFashionCartBadgeProps) => {
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
      className={`relative transition-all duration-300 hover:scale-105 rounded-full hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 ${
        isAnimating ? 'opacity-90' : ''
      }`}
    >
      <div className="relative flex items-center justify-center">
        <ShoppingBag size={iconSize} className="stroke-[1.75]" />
        
        {displayCount > 0 && (
          <Badge 
            className={`
              absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-semibold tracking-tighter
              bg-amber-500 hover:bg-amber-500 text-stone-950 rounded-full border border-white shadow-sm
              transition-all duration-300 ease-in-out
              ${isAnimating ? 'scale-125 rotate-12' : 'scale-100'}
            `}
          >
            {displayCount > 99 ? '99+' : displayCount}
          </Badge>
        )}
        
        {/* Luxury subtle pulse animation for fashion theme updates */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping duration-700"></div>
        )}
      </div>
      
      {showText && (
        <span className="ml-2.5 hidden sm:inline text-xs font-medium tracking-widest uppercase text-stone-700">
          Bag {displayCount > 0 && `(${displayCount})`}
        </span>
      )}
    </Button>
  );
});

GemFashionCartBadge.displayName = 'GemFashionCartBadge';

export default GemFashionCartBadge;