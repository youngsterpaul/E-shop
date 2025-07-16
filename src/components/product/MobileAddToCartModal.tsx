

import { useState } from 'react';
import { ShoppingCart, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useProductVariants } from '@/hooks/useProductVariants';
import { getCartDisplayAttributes } from '@/data/categoryAttributes';
import DynamicAttributeSelector from './DynamicAttributeSelector';

interface MobileAddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    product_id: string;
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
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);

  // Get dynamic attributes for this product's category
  const dynamicAttributes = getCartDisplayAttributes(product.category, product.subcategory);
  const hasVariants = getVariantTypes().length > 0;

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
    const requiredAttributes = dynamicAttributes.filter(attr => attr.required);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">Add to Cart</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="flex items-start gap-3 pb-4 border-b">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-600">({product.reviews || 0})</span>
                <Badge variant={product.inStock ? "default" : "destructive"} className="text-xs">
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-lg font-bold text-primary">
                  {formatPrice(calculatePrice())}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Variants */}
          {getVariantTypes().map(type => (
            <div key={type}>
              <h4 className="text-sm font-medium text-gray-900 mb-2 capitalize">
                {type} <span className="text-red-500">*</span>
              </h4>
              {type === 'color' ? (
                <RadioGroup 
                  value={selectedVariants[type] || ''} 
                  onValueChange={(value) => onVariantChange(type, value)}
                  className="flex gap-2 flex-wrap"
                >
                  {getVariantsByType(type).map((variant) => (
                    <div key={variant.id} className="flex items-center">
                      <RadioGroupItem
                        value={variant.variant_value}
                        id={`modal-${type}-${variant.variant_value}-${variant.id}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`modal-${type}-${variant.variant_value}-${variant.id}`}
                        className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-all ${
                          selectedVariants[type] === variant.variant_value 
                            ? 'border-primary border-3 ring-2 ring-primary/20' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: variant.variant_value.toLowerCase() }}
                        title={variant.variant_value}
                      />
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <RadioGroup 
                  value={selectedVariants[type] || ''} 
                  onValueChange={(value) => onVariantChange(type, value)}
                  className="flex gap-2 flex-wrap"
                >
                  {getVariantsByType(type).map((variant) => (
                    <div key={variant.id}>
                      <RadioGroupItem
                        value={variant.variant_value}
                        id={`modal-${type}-${variant.variant_value}-${variant.id}`}
                        className="sr-only"
                      />
                      <Label
                        htmlFor={`modal-${type}-${variant.variant_value}-${variant.id}`}
                        className={`px-3 py-1.5 border rounded-md cursor-pointer transition-all inline-block text-sm ${
                          selectedVariants[type] === variant.variant_value
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {variant.variant_value}
                        {variant.price_modifier !== 0 && (
                          <span className="ml-1 text-xs">
                            ({variant.price_modifier > 0 ? '+' : ''}{formatPrice(variant.price_modifier)})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          ))}

          {/* Dynamic Product Attributes */}
          {dynamicAttributes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Select Options</h4>
              <DynamicAttributeSelector
                attributes={dynamicAttributes}
                selectedAttributes={selectedAttributes}
                onAttributeChange={handleAttributeChange}
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Quantity</h4>
            <div className="flex items-center border rounded-md w-fit">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100 text-sm"
              >
                -
              </button>
              <span className="px-4 py-2 border-x text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100 text-sm"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || isAddingToCart}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {isAddingToCart ? 'Added' : `Add to Cart - ${formatPrice(calculatePrice() * quantity)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MobileAddToCartModal;