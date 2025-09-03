import { useState, useEffect } from 'react';
import { ShoppingCart, X, Star, Minus, Plus, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useProductVariants } from '@/hooks/useProductVariants';
import { useProductReviews } from '@/hooks/useReviews';
//import { getCartDisplayAttributes } from '@/data/categoryAttributes';
import DynamicAttributeSelector from './DynamicAttributeSelector';
import OptimizedImage from '../OptimizedImage';

interface MobileAddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    product_id: string;
    image: string | string[]; // Fixed: Updated to match MobileBottomActions
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
  const [variantsInitialized, setVariantsInitialized] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  
  // Fetch real reviews data using the same hook as ProductTabs
  const { data: reviews = [], isLoading: reviewsLoading } = useProductReviews(product.product_id);

  // Get dynamic attributes for this product's category
  // const dynamicAttributes = getCartDisplayAttributes(product.category, product.subcategory);
  const hasVariants = getVariantTypes().length > 0;

  // Calculate real rating and review count from fetched reviews
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : product.rating; // fallback to product.rating if no reviews

  // Use real review count or fallback to product.reviews
  const displayReviewCount = totalReviews > 0 ? totalReviews : (product.reviews || 0);

  // Auto-select first variant for each type when modal opens
  useEffect(() => {
    if (isOpen && hasVariants && !variantsInitialized) {
      const variantTypes = getVariantTypes();
      
      variantTypes.forEach(type => {
        // Only auto-select if no variant is already selected for this type
        if (!selectedVariants[type]) {
          const variantsForType = getVariantsByType(type);
          if (variantsForType.length > 0) {
            // Select the first variant
            onVariantChange(type, variantsForType[0].variant_value);
          }
        }
      });
      
      setVariantsInitialized(true);
    }
  }, [isOpen, hasVariants, variantsInitialized, selectedVariants, getVariantTypes, getVariantsByType, onVariantChange]);

  // Reset initialization state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setVariantsInitialized(false);
    }
  }, [isOpen]);

  // Handle modal animations and body scroll
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

  // Helper function to get the first image from array or return string
  const getProductImage = (image: string | string[]): string => {
    if (Array.isArray(image)) {
      return image.length > 0 ? image[0] : '/placeholder.svg';
    }
    return image || '/placeholder.svg';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const handleAddToCart = async () => {
    // Check if product has variants and if all variants are selected
    if (hasVariants) {
      const variantTypes = getVariantTypes();
      const missingVariants = variantTypes.filter(type => !selectedVariants[type]);
      
      if (missingVariants.length > 0) {
        toast({
          title: "Please choose a variant",
          description: `Please select: ${missingVariants.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

    // Check if required attributes are selected
    // const requiredAttributes = dynamicAttributes.filter(attr => attr.required);
    {/*
    const missingRequired = requiredAttributes.filter(attr => 
      !selectedAttributes[attr.id] || selectedAttributes[attr.id] === ''
    ); 


    if (missingRequired.length > 0) {
      toast({
        title: "Missing Required Selection",
        description: `Please select: ${missingRequired.map(attr => attr.name).join(', ')}`,
        variant: "destructive"
      });
      return;
    }
    */}
    setIsAddingToCart(true);
    
    // Combine variants and dynamic attributes
    const allSelections = {
      ...selectedVariants,
      ...selectedAttributes
    };
    
    try {
      await addToCart(product.product_id, allSelections, quantity);
      toast({
        title: "Added to Cart",
        description: `${product.name} has been added to your cart.`,
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAttributeChange = (attributeId: string, value: any) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          showAnimation ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />
      
      {/* Modal Container */}
      <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out ${
        showAnimation ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Bottom Sheet */}
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden">
          {/* Drag Handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Select Options</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Product Summary */}
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                  <OptimizedImage
                    src={getProductImage(product.image)}
                    alt={product.name}
                    width={80}
                    height={80}
                    aspectRatio="square"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.floor(averageRating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      {reviewsLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        `(${displayReviewCount})`
                      )}
                    </span>
                    <Badge variant={product.inStock ? "default" : "destructive"} className="text-xs">
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-orange-500">
                      {formatPrice(calculatePrice())}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Variants Selection */}
            <div className="p-6 space-y-6">
              {getVariantTypes().map(type => (
                <div key={type}>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <span className="capitalize">{type}</span>
                    <span className="text-red-500 ml-1">*</span>
                  </h4>
                  
                  {type === 'color' ? (
                    <div className="flex gap-3 flex-wrap">
                      {getVariantsByType(type).map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => onVariantChange(type, variant.variant_value)}
                          className={`relative w-12 h-12 rounded-full border-3 transition-all ${
                            selectedVariants[type] === variant.variant_value
                              ? 'border-orange-500 ring-2 ring-orange-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: variant.variant_value.toLowerCase() }}
                          title={variant.variant_value}
                        >
                          {selectedVariants[type] === variant.variant_value && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      {getVariantsByType(type).map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => onVariantChange(type, variant.variant_value)}
                          className={`px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all ${
                            selectedVariants[type] === variant.variant_value
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {variant.variant_value}
                          {variant.price_modifier !== 0 && (
                            <span className="ml-1 text-xs opacity-75">
                              ({variant.price_modifier > 0 ? '+' : ''}{formatPrice(variant.price_modifier)})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Dynamic Product Attributes */}
              {/*
              {dynamicAttributes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Options</h4>
                  <DynamicAttributeSelector
                    attributes={dynamicAttributes}
                    selectedAttributes={selectedAttributes}
                    onAttributeChange={handleAttributeChange}
                  />
                </div>
              )}
              */}

              {/* Quantity Selector */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Quantity</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span className="px-6 py-3 font-medium text-gray-900 bg-gray-50 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <span className={`font-medium ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                      {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Bottom Actions */}
          <div className="border-t border-gray-100 p-6 bg-white">
            <div className="flex items-center gap-3">
              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || isAddingToCart}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    <span>Add to Cart - {formatPrice(calculatePrice() * quantity)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileAddToCartModal;
