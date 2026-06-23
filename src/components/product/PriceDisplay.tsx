import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Sparkles } from 'lucide-react';

interface GemFashionStyleProps {
  currentPrice: number;
  originalPrice?: number;
  flashSalePrice?: number;
  showFlashBadge?: boolean;
}

const GemFashionStyle: React.FC<GemFashionStyleProps> = ({ 
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
    <div className="space-y-1.5 font-sans tracking-tight">
      {/* Gem Fashion Luxury Promo Badge */}
      {showFlashBadge && hasFlashSale && (
        <Badge className="bg-gradient-to-r from-neutral-900 to-rose-950 text-amber-100 border border-amber-500/30 uppercase tracking-widest text-[10px] px-2.5 py-0.5 shadow-sm font-medium">
          <Sparkles className="h-3 w-3 mr-1 text-amber-400 animate-spin-slow" />
          Exclusive Offer
        </Badge>
      )}

      {/* Pricing Row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Main Price - Bold Obsidian / Emerald Accent */}
        <span className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-extrabold tracking-tighter ${hasFlashSale ? 'text-emerald-700 dark:text-emerald-400' : 'text-neutral-900 dark:text-neutral-50'}`}>
          {formatPrice(displayPrice)}
        </span>
        
        {/* Original Price - Subtle Muted Strikethrough */}
        {(showOriginalPrice || hasFlashSale) && (
          <span className="text-sm text-neutral-400 dark:text-neutral-500 line-through font-light">
            {formatPrice(hasFlashSale ? currentPrice : originalPrice!)}
          </span>
        )}

        {/* Fashion-forward Minimalist Discount Badge */}
        {discount > 0 && (
          <Badge variant="outline" className="border-rose-200 bg-rose-50/50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900 text-xs font-bold px-2 rounded-full">
            {discount}% OFF
          </Badge>
        )}
      </div>
      
      {/* Savings Callout */}
      {hasFlashSale && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium italic">
          Complimentary savings of {formatPrice(currentPrice - flashSalePrice)}
        </p>
      )}
    </div>
  );
};

export default GemFashionStyle;