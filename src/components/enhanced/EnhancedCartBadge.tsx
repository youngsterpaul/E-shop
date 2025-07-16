
import { memo, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import QuickViewCart from './QuickViewCart';

interface EnhancedCartBadgeProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedCartBadge = memo(({ showText = false, size = 'md' }: EnhancedCartBadgeProps) => {
  const { totalItems } = useCart();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

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
    <>
      <Button
        variant="ghost"
        size={buttonSize}
        onClick={() => setIsQuickViewOpen(true)}
        className="relative transition-all duration-300 hover:scale-105"
      >
        <div className="relative">
          <ShoppingCart size={iconSize} />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs animate-in zoom-in-50 duration-200"
            >
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
        </div>
        
        {showText && (
          <span className="ml-2 hidden sm:inline">
            Cart {totalItems > 0 && `(${totalItems})`}
          </span>
        )}
      </Button>

      <QuickViewCart 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
    </>
  );
});

EnhancedCartBadge.displayName = 'EnhancedCartBadge';

export default EnhancedCartBadge;
