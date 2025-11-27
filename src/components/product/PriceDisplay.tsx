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

  return (
    <div className="space-y-2">
      {showFlashBadge && hasFlashSale && (
        <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <Zap className="h-3 w-3 mr-1" />
          Flash Sale
        </Badge>
      )}

      <div className="flex items-center gap-4">
        {!isMobile && (
          <span className={`text-lg font-bold ${hasFlashSale ? 'text-red-500' : 'text-orange-500'}`}>
            {formatPrice(displayPrice)}
          </span>
        )}
        {(showOriginalPrice || hasFlashSale) && !isMobile && (
          <span className="text-xl text-gray-500 line-through">
            {formatPrice(hasFlashSale ? currentPrice : originalPrice!)}
          </span>
        )}
        {hasFlashSale && (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Save {formatPrice(currentPrice - flashSalePrice)}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PriceDisplay;
