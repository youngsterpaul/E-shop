import { Heart, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductFlashSaleFromContext } from '@/contexts/FlashSaleContext';
import OptimizedImage from './OptimizedImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews?: number;
  reviews_count?: number;
  discount?: number;                                 
  category: string;
  inStock: boolean;
  subcategory?: string;
  attributes?: Record<string, any>;
  features?: string[];
}

interface FlashSaleOverride {
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
}

interface ProductCardProps {
  product: Product;
  flashSaleOverride?: FlashSaleOverride | null;
}

const ProductCard = ({ product, flashSaleOverride }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isMobile = isMobileUserAgent();
  const { data: contextFlashSale } = useProductFlashSaleFromContext(product.id);
  const flashSale = flashSaleOverride !== undefined ? flashSaleOverride : contextFlashSale;
  
  const badgeClass = isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
  const wishlistBtnClass = isMobile ? 'p-1.5' : 'p-2';
  const heartSize = isMobile ? 14 : 16;

  const productSlug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
      
  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateFlashPrice = (basePrice: number) => {
    if (!flashSale) return null;
    if (flashSale.discount_type === 'percentage') {
      return basePrice * (1 - flashSale.discount_value / 100);
    }
    return basePrice - flashSale.discount_value;
  };

  const flashPrice = flashSale ? calculateFlashPrice(product.price) : null;
  const displayPrice = flashPrice || product.price;
  const averageRating = product.rating || 5;
  const displayReviewCount = product.reviews_count ?? product.reviews ?? 0;

  return (
    <Link 
      to={`/product/${productSlug}/${product.id}`}
      className={`group relative bg-card hover:rounded-2xl overflow-hidden transition-all duration-300 /border /border-border/40 ${
        isMobile
          ? 'shadow-sm active:scale-[0.98]'
          : 'shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-border/80'
      }`}
      aria-label={`View ${product.name} - ${formatPrice(displayPrice)}${!product.inStock ? ' (Out of Stock)' : ''}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/20">
        <OptimizedImage
          src={product.image}
          alt={`${product.name} - Product image`}
          width={300}
          height={300}
          aspectRatio="square"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />

        {/* Subtle depth gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          type="button"
          className={`absolute ${isMobile ? 'top-1.5 right-1.5' : 'top-2.5 right-2.5'} ${wishlistBtnClass} rounded-full transition-all duration-200 shadow-md min-w-[44px] min-h-[44px] flex items-center justify-center ${
            isInWishlist(product.id) 
              ? 'bg-red-50 text-red-500 shadow-red-200' 
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-red-500 backdrop-blur-sm'
          }`}
          aria-label={isInWishlist(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isInWishlist(product.id)}
        >
          <Heart
            size={heartSize}
            className={`transition-all duration-200 ${isInWishlist(product.id) ? 'fill-current scale-110' : ''}`}
            aria-hidden="true"
          />
        </button>
        
        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center backdrop-blur-[2px]" aria-hidden="true">
            <span className="bg-foreground/80 text-background px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wide">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`${isMobile ? 'p-2.5 space-y-1.5' : 'p-3.5 space-y-2'}`}>
        {/* Product Name */}
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-foreground line-clamp-2 leading-snug ${isMobile ? 'min-h-[2rem]' : 'min-h-[2.5rem]'} group-hover:text-primary transition-colors duration-200`}>
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1" role="img" aria-label={`Rating: ${averageRating} out of 5 stars, ${displayReviewCount} reviews`}>
          <div className="flex items-center gap-0.5" aria-hidden="true">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={isMobile ? 10 : 12}
                className={`${
                  i < Math.floor(averageRating) 
                    ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
                    : 'text-muted-foreground/25'
                }`}
              />
            ))}
          </div>
          <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground font-medium`} aria-hidden="true">
            ({displayReviewCount > 999 ? '999+' : displayReviewCount})
          </span>
        </div>

        {/* Price */}
        <div className={`flex items-baseline gap-2 ${isMobile ? 'pt-0.5' : 'pt-1'}`}>
          <span className={`${isMobile ? 'text-sm' : 'text-base'} font-extrabold tracking-tight ${
            flashPrice
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-500'
              : 'text-foreground'
          }`}>
            {formatPrice(displayPrice)}
          </span>
          {flashPrice && (
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground/70 line-through`}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;