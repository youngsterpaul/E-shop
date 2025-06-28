
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface CartBadgeProps {
  onClick?: () => void;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CartBadge = ({ onClick, showText = false, size = 'md' }: CartBadgeProps) => {
  const { totalItems } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(totalItems);

  // Animate when count changes
  useEffect(() => {
    if (totalItems !== prevCount && totalItems > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevCount(totalItems);
  }, [totalItems, prevCount]);

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
      className={`relative ${isAnimating ? 'animate-pulse' : ''}`}
    >
      <div className="relative">
        <ShoppingCart size={iconSize} />
        {totalItems > 0 && (
          <Badge 
            variant="destructive" 
            className={`
              absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs
              ${isAnimating ? 'animate-bounce scale-125' : ''}
              transition-all duration-300
            `}
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
        
        {/* Pulse animation for new items */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
        )}
      </div>
      
      {showText && (
        <span className="ml-2 hidden sm:inline">
          Cart {totalItems > 0 && `(${totalItems})`}
        </span>
      )}
    </Button>
  );
};

export default CartBadge;
