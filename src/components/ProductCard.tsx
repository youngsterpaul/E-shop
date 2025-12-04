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

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isMobile = isMobileUserAgent();
  const { data: flashSale } = useProductFlashSaleFromContext(product.id);

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
      className={`group relative bg-card rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg ${isMobile ? 'shadow-sm' : 'shadow-sm hover:-translate-y-1'}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          width={300}
          height={300}
          aspectRatio="square"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {flashSale && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
              <Zap size={12} className="fill-current" />
              Flash
            </span>
          )}
          {!flashSale && product.discount && product.discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
              -{product.discount}%
            </span>
          )}
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 shadow-md ${
            isInWishlist(product.id) 
              ? 'bg-red-50 text-red-500' 
              : 'bg-white/90 text-muted-foreground hover:bg-white hover:text-red-500'
          }`}
          aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            className={`transition-all ${isInWishlist(product.id) ? 'fill-current' : ''}`}
          />
        </button>
        
        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-foreground/80 text-background px-3 py-1.5 rounded-md text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={`${
                  i < Math.floor(averageRating) 
                    ? 'text-amber-400 fill-amber-400' 
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({displayReviewCount > 999 ? '999+' : displayReviewCount})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className={`text-base font-bold ${flashPrice ? 'text-red-600' : 'text-foreground'}`}>
            {formatPrice(displayPrice)}
          </span>
          {flashPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;