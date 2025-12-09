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
  
  // Mobile-specific compact sizes
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
    <Card className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 bg-white h-full border border-white rounded-sm overflow-hidden w-full mx-auto ${isMobile ? 'max-w-[800px]':'max-w-[180px] hover:rounded-lg'}`}>
      <CardContent className={`h-full flex flex-col ${isMobile ? 'p-0' : 'p-2'}`}>
        <Link to={`/product/${productSlug}/${product.id}`} className="block">
          <div className="relative overflow-hidden bg-white aspect-square rounded-sm">
            <OptimizedImage
              src={product.image}
              alt={product.name}
              width={200}
              height={200}
              aspectRatio="square"
              className="w-full h-full object-cover bg-gray-100"
              sizes="200px"
            />
            
            {/* Flash Sale Badge */}
            {flashSale && (
              <div className="absolute top-1 left-1 bg-gradient-to-r from-red-500 to-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-sm flex items-center gap-1">
                <Zap size={10} />
                Flash Sale
              </div>
            )}
            
            {/* Discount Badge */}
            {!flashSale && product.discount && (
              <div className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-xs font-medium shadow-sm">
                -{product.discount}%
              </div>
            )}
            
            {/* Out of Stock Overlay */}
            {!product.inStock && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-medium text-xs bg-black bg-opacity-75 px-2 py-1 rounded">
                  Out of Stock
                </span>
              </div>
            )}
            
            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleWishlistToggle();
              }}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-white/90 hover:bg-white shadow-sm transition-all duration-200 hover:scale-110"
              aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                size={14}
                className={`transition-colors ${
                  isInWishlist(product.id) 
                    ? 'text-red-500 fill-current' 
                    : 'text-gray-600 hover:text-red-400'
                }`}
              />
            </button>
          </div>
        </Link>

        {/* Product Info - Kilimall style compact layout */}
        <div className="p-1 flex flex-col flex-grow space-y-1">
          <Link to={`/product/${productSlug}/${product.id}`}>
            <h3 className="font-medium. text-sm text-gray-900 line-clamp-2 hover:text-orange-600 transition-colors text-xs leading-tight group-hover:text-red-600 min-h-[32px]">
              {product.name}
            </h3>
          </Link>

          {/* Rating - More compact with real data */}
          <div className="flex items-center">
            <div className="flex items-center mr-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({displayReviewCount > 999 ? '999+' : displayReviewCount})
            </span>
          </div>

        {/* Price */}
        <div className={`flex items-baseline gap-1.5 ${isMobile ? 'pt-0.5' : 'pt-1'}`}>
          <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold ${flashPrice ? 'text-red-600' : 'text-foreground'}`}>
            {formatPrice(displayPrice)}
          </span>
          {flashPrice && (
            <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground line-through`}>
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;