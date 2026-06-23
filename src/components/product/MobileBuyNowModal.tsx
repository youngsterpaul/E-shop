import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, Star, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useProductReviews } from '@/hooks/useReviews';
import OptimizedImage from '../OptimizedImage';
import VariantSelector from '@/components/product/VariantSelector';

interface GemFashionStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    product_id: string;
    image: string | string[];
    name: string;
    price: number;
    originalPrice?: number;
    description?: string;
    rating: number;
    reviews?: number;
    inStock: boolean;
    category: string;
    subcategory?: string;
    attributes?: Record<string, any>;
    features?: string[];
  };
  selectedVariants: Record<string, string>;
  requiredVariants: string[];
  onVariantChange: (type: string, value: string) => void;
  calculatePrice: () => number;
}

const GemFashionStyleModal = ({
  isOpen,
  onClose,
  product,
  selectedVariants,
  requiredVariants,
  onVariantChange,
  calculatePrice,
}: GemFashionStyleModalProps) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);

  const hasVariants = getVariantTypes().length > 0;
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 5;
  const displayReviewCount = totalReviews > 0 ? totalReviews : product.reviews || 0;

  // Get color variants for image cycling
  const colorVariants = variants.filter(v => 
    v.variant_type.toLowerCase().includes('color') || 
    v.variant_type.toLowerCase().includes('colour')
  );
  const hasColorVariants = colorVariants.length > 0;

  // Get current image based on selected color variant
  const getCurrentImage = () => {
    if (hasColorVariants) {
      const colorType = getVariantTypes().find(type => 
        type.toLowerCase().includes('color') || type.toLowerCase().includes('colour')
      );
      if (colorType && selectedVariants[colorType]) {
        const selectedColorVariant = colorVariants.find(v => 
          v.variant_type === colorType && v.variant_value === selectedVariants[colorType]
        );
        if (selectedColorVariant?.image_url) {
          return selectedColorVariant.image_url;
        }
      }
    }
    return getProductImage(product.image);
  };

  const handleImageClick = () => {
    if (!hasColorVariants) return;
    
    const colorType = getVariantTypes().find(type => 
      type.toLowerCase().includes('color') || type.toLowerCase().includes('colour')
    );
    
    if (!colorType) return;

    const currentSelectedValue = selectedVariants[colorType];
    const currentIndex = colorVariants.findIndex(v => 
      v.variant_type === colorType && v.variant_value === currentSelectedValue
    );
    
    // Cycle to next color variant
    const nextIndex = (currentIndex + 1) % colorVariants.filter(v => v.variant_type === colorType).length;
    const colorVariantsOfType = colorVariants.filter(v => v.variant_type === colorType);
    const nextVariant = colorVariantsOfType[nextIndex];
    
    if (nextVariant) {
      onVariantChange(colorType, nextVariant.variant_value);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);
      setQuantity(1);
      document.body.style.overflow = 'hidden';
    } else {
      setShowAnimation(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getProductImage = (image: string | string[]): string => {
    if (Array.isArray(image)) {
      return image.length > 0 ? image[0] : '/placeholder.svg';
    }
    return image || '/placeholder.svg';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(price);
  };

  const handleBuyNow = async () => {
    if (!product.inStock) {
      toast({
        title: "Out of Stock",
        description: "This collection item is currently unavailable",
        variant: "destructive"
      });
      return;
    }

    if (hasVariants) {
      const variantTypes = getVariantTypes();
      const missingVariants = variantTypes.filter((type) => !selectedVariants[type]);
      if (missingVariants.length > 0) {
        toast({
          title: 'Select styling options',
          description: `Please select: ${missingVariants.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsBuyingNow(true);

    try {
      await addToCart(product.product_id, selectedVariants, quantity);
      onClose();
      
      if (user) {
        navigate('/checkout');
      } else {
        sessionStorage.setItem('redirectAfterAuth', '/checkout');
        navigate('/auth');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to proceed to luxury checkout",
        variant: "destructive"
      });
      setIsBuyingNow(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-zinc-950/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
          showAnimation ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="bg-white rounded-t-[2rem] shadow-2xl min-h-[75vh] overflow-hidden border-t border-zinc-100">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-zinc-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-zinc-100">
            <h2 className="text-sm font-bold tracking-wider text-zinc-900 uppercase">Gem Fashion Style</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors">
              <X className="h-4 w-4 text-zinc-400 hover:text-zinc-700" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-160px)]">
            {/* Product Summary */}
            <div className="p-6 bg-zinc-50/50 border-b border-zinc-100">
              <div className="flex items-start gap-4">
                <div 
                  className={`w-20 h-20 bg-white rounded-xl shadow-sm ring-1 ring-zinc-100 flex items-center justify-center overflow-hidden transition-all ${
                    hasColorVariants ? 'cursor-pointer hover:ring-2 hover:ring-emerald-600' : ''
                  }`}
                  onClick={handleImageClick}
                  title={hasColorVariants ? 'Tap to view color variations' : ''}
                >
                  <OptimizedImage
                    src={getCurrentImage()}
                    alt={product.name}
                    width={80}
                    height={80}
                    aspectRatio="square"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm leading-snug text-zinc-800 mb-1 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(averageRating)
                              ? 'text-amber-400 fill-current'
                              : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      {reviewsLoading ? <span className="animate-pulse">...</span> : `(${displayReviewCount} reviews)`}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-700">
                      {formatPrice(calculatePrice())}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-zinc-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="p-6 space-y-6">
              {hasVariants && (
                <div>
                  <h4 className="text-xs font-bold tracking-wide text-zinc-900 uppercase mb-3 flex items-center">
                    <span>Select Options</span>
                    <span className="text-emerald-600 ml-0.5">*</span>
                  </h4>

                  <VariantSelector
                    variants={(() => {
                      const colorMap: Record<string, string> = {
                        red: '#dc2626',
                        blue: '#2563eb',
                        green: '#059669',
                        black: '#09090b',
                        white: '#ffffff',
                        gray: '#71717a',
                        grey: '#71717a',
                        yellow: '#eab308',
                        orange: '#ea580c',
                        purple: '#9333ea',
                        pink: '#db2777',
                        brown: '#78350f',
                        navy: '#1e3a8a',
                        maroon: '#991b1b',
                        gold: '#ca8a04',
                        silver: '#cbd5e1',
                        beige: '#f5f5dc',
                        cream: '#fffdd0',
                        turquoise: '#0d9488',
                        lime: '#4d7c0f',
                      };

                      return getVariantTypes().map((type) => {
                        const lowerType = type.toLowerCase();
                        let variantType: 'color' | 'size' | 'material' | 'other' = 'other';
                        if (lowerType.includes('color') || lowerType.includes('colour')) variantType = 'color';
                        else if (lowerType.includes('size')) variantType = 'size';
                        else if (
                          lowerType.includes('material') ||
                          lowerType.includes('fabric') ||
                          lowerType.includes('texture')
                        )
                          variantType = 'material';

                        return {
                          id: type,
                          name: type.charAt(0).toUpperCase() + type.slice(1),
                          type: variantType,
                          values: getVariantsByType(type).map((variant) => {
                            const variantValue = String(variant.variant_value || '');
                          return {
                            id: variantValue,
                            name: variantValue,
                            value:
                              variantType === 'color'
                                ? colorMap[variantValue.toLowerCase()] || '#71717a'
                                : variantValue,
                            available: variant.stock_quantity > 0,
                            priceModifier: variant.price_modifier || 0,
                            image: variant.image_url || null,
                            stockQuantity: variant.stock_quantity
                          };
                        }),
                      };
                    });
                  })()}
                  selectedVariants={selectedVariants}
                  onVariantChange={onVariantChange}
                  stockInfo={(() => {
                    const stockInfo: Record<string, number> = {};
                    getVariantTypes().forEach((type) => {
                      getVariantsByType(type).forEach((variant) => {
                        const key = `${type}-${variant.variant_value}`;
                        stockInfo[key] = variant.stock_quantity;
                      });
                    });
                    return stockInfo;
                  })()}
                  />
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <h4 className="text-xs font-bold tracking-wide text-zinc-900 uppercase mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/50 p-0.5">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-30"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5 text-zinc-600" />
                    </button>
                    <span className="px-4 font-semibold text-zinc-900 min-w-[45px] text-center text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-zinc-600" />
                    </button>
                  </div>

                  <div className="text-xs">
                    <span
                      className={`font-semibold px-2.5 py-1 rounded-full text-[11px] ${
                        product.inStock 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="border-t border-zinc-100 p-6 bg-white bottom-0 fixed left-0 right-0">
            <button
              onClick={handleBuyNow}
              disabled={!product.inStock || isBuyingNow}
              className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400
              text-white font-medium tracking-wide py-3.5 px-4 rounded-xl 
              transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
            >
              {isBuyingNow ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Selection...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-current text-amber-400 border-none" />
                  <span className="font-semibold">Order Now – {formatPrice(calculatePrice() * quantity)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GemFashionStyleModal;