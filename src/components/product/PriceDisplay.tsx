import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Zap } from 'lucide-react';

interface PriceDisplayProps {
  currentPrice: number;
  originalPrice?: number;
  flashSalePrice?: number;
  showFlashBadge?: boolean;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  currentPrice, 
  originalPrice,
  flashSalePrice,
  showFlashBadge = false
}) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(price);

  const displayPrice = flashSalePrice || currentPrice;
  const showOriginalPrice = originalPrice && displayPrice !== originalPrice;
  const hasFlashSale = flashSalePrice && flashSalePrice < currentPrice;
  const isMobile = isMobileUserAgent();

  const discount = showOriginalPrice
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : hasFlashSale
    ? Math.round(((currentPrice - flashSalePrice) / currentPrice) * 100)
    : 0;

  return (
    <div className="space-y-2">
      {showFlashBadge && hasFlashSale && (
        <Badge className="bg-gradient-to-r from-destructive to-orange-500 text-destructive-foreground animate-pulse">
          <Zap className="h-3 w-3 mr-1" />
          Flash Sale
        </Badge>
      )}

      <div className="flex items-baseline gap-3 flex-wrap">
        <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${hasFlashSale ? 'text-destructive' : 'text-primary'}`}>
          {formatPrice(displayPrice)}
        </span>
        
        {(showOriginalPrice || hasFlashSale) && (
          <span className="text-sm text-muted-foreground line-through">
            {formatPrice(hasFlashSale ? currentPrice : originalPrice!)}
          </span>
        )}
        {discount > 0 && (
          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs font-semibold">
            -{discount}%
          </Badge>
        )}
      </div>
      
      {hasFlashSale && (
        <p className="text-xs text-destructive font-medium">
          You save {formatPrice(currentPrice - flashSalePrice)}
        </p>
      )}
    </div>
  );
};

export default PriceDisplay;
