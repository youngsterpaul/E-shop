import { useState, useEffect } from 'react';
import { ShoppingCart, X, Star, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useProductReviews } from '@/hooks/useReviews';
import OptimizedImage from '../OptimizedImage';
import VariantSelector from '@/components/product/VariantSelector';

interface MobileAddToCartModalProps {
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

const MobileAddToCartModal = ({
  isOpen,
  onClose,
  product,
  selectedVariants,
  requiredVariants,
  onVariantChange,
  calculatePrice,
}: MobileAddToCartModalProps) => {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
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

  const handleAddToCart = async () => {
    if (hasVariants) {
      const variantTypes = getVariantTypes();
      const missingVariants = variantTypes.filter((type) => !selectedVariants[type]);
      if (missingVariants.length > 0) {
        toast({
          title: 'Please choose a variant',
          description: `Please select: ${missingVariants.join(', ')}`,
          variant: 'destructive',
        });
        return;
      }
    }

    setIsAddingToCart(true);

    try {
      await addToCart(product.product_id, { ...selectedVariants, ...selectedAttributes }, quantity);
      toast({
        title: 'Added to Cart',
        description: `${product.name} has been added to your Gem Fashion Style collection.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToCart(false);
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
        className={`fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 transition-opacity duration-300 ${
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
        <div className="bg-white rounded-t-[2.5rem] shadow-[0_-8px_30px_rgb(0,0,0,0.06)] min-h-[75vh] overflow-hidden border-t border-neutral-100">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-neutral-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-neutral-50">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-800">Gem Fashion Style</h2>
              <p className="text-[11px] text-neutral-400">Tailor your premium selection</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 rounded-full transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-160px)] px-6">
            {/* Product Summary */}
            <div className="py-5 border-b border-neutral-100">
              <div className="flex items-start gap-4">
                <div 
                  className={`w-20 h-20 bg-neutral-50 rounded-xl overflow-hidden shadow-xs border border-neutral-100 flex items-center justify-center transition-all ${
                    hasColorVariants ? 'cursor-pointer hover:ring-2 hover:ring-emerald-800' : ''
                  }`}
                  onClick={handleImageClick}
                  title={hasColorVariants ? 'Tap to cycle through colors' : ''}
                >
                  <OptimizedImage
                    src={getCurrentImage()}
                    alt={product.name}
                    width={80}
                    height={80}
                    aspectRatio="square"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="font-medium text-sm text-neutral-800 leading-tight mb-1.5 line-clamp-2 tracking-tight">
                    {product.name}
                  </h3>

                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(averageRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-neutral-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-neutral-400">
                      {reviewsLoading ? <span className="animate-pulse">...</span> : `(${displayReviewCount} reviews)`}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-emerald-800 tracking-tight">
                      {formatPrice(calculatePrice())}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-neutral-400 line-through font-light">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="py-5 space-y-6">
              {hasVariants && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-3 flex items-center">
                    <span>Configure Options</span>
                    <span className="text-rose-400 ml-1">*</span>
                  </h4>

                  <VariantSelector
                    variants={(() => {
                      const colorMap: Record<string, string> = {
                        red: '#ef4444',
                        blue: '#3b82f6',
                        green: '#10b981',
                        black: '#1f2937',
                        white: '#ffffff',
                        gray: '#6b7280',
                        grey: '#6b7280',
                        yellow: '#f59e0b',
                        orange: '#f97316',
                        purple: '#8b5cf6',
                        pink: '#ec4899',
                        brown: '#92400e',
                        navy: '#1e3a8a',
                        maroon: '#7f1d1d',
                        gold: '#d97706',
                        silver: '#9ca3af',
                        beige: '#f5f5dc',
                        cream: '#fffdd0',
                        turquoise: '#06b6d4',
                        lime: '#65a30d',
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
                                ? colorMap[variantValue.toLowerCase()] || '#6b7280'
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
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden shadow-2xs bg-neutral-50/50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-neutral-100 text-neutral-600 transition-colors disabled:opacity-30"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-4 font-semibold text-neutral-800 min-w-[45px] text-center text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-neutral-100 text-neutral-600 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-xs font-medium tracking-tight">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        product.inStock 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="border-t border-neutral-100 p-5 bg-white bottom-0 fixed left-0 right-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              className="w-full bg-neutral-900 hover:bg-emerald-900 disabled:bg-neutral-200 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm uppercase tracking-wider shadow-md disabled:shadow-none"
            >
              {isAddingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="normal-case">Adding to Collection...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Bag &bull; {formatPrice(calculatePrice() * quantity)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileAddToCartModal;