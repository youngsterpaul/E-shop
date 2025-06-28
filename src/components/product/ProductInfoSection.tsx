import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useProductVariants } from '@/hooks/useProductVariants';
import { getCartDisplayAttributes } from '@/data/categoryAttributes';
import DynamicAttributeSelector from './DynamicAttributeSelector';

interface ProductInfoSectionProps {
  product: {
    product_id: string;
    name: string;
    price: number;
    description?: string;
    rating?: number;
    stock?: number;
    categories?: string;
    subcategories?: string;
    attributes?: Record<string, any>;
    features?: string[] | string;
  };
}

const ProductInfoSection = ({ product }: ProductInfoSectionProps) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  
  const dynamicAttributes = getCartDisplayAttributes(product.categories || '', product.subcategories);
  const inStock = (product.stock || 0) > 0;
  const reviewCount = (product as any).reviews || 0;
  const hasVariants = getVariantTypes().length > 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  const calculatePrice = () => {
    let totalModifier = 0;
    Object.entries(selectedVariants).forEach(([type, value]) => {
      const variant = variants.find(v => v.variant_type === type && v.variant_value === value);
      if (variant) {
        totalModifier += variant.price_modifier;
      }
    });
    return product.price + totalModifier;
  };

  const getStockStatus = () => {
    const stock = product.stock || 0;
    if (stock === 0) return { status: 'Out of Stock', color: 'destructive' as const };
    if (stock < 10) return { status: `Only ${stock} left`, color: 'secondary' as const };
    return { status: 'In Stock', color: 'default' as const };
  };

  const handleAddToCart = async () => {
    // Check if product has variants and if all variants are selected
    if (hasVariants) {
      const variantTypes = getVariantTypes();
      const missingVariants = variantTypes.filter(type => !selectedVariants[type]);
      
      if (missingVariants.length > 0) {
        toast({
          title: "Variant Selection Required",
          description: `Please select: ${missingVariants.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
    }

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
    
    const allSelections = {
      ...selectedVariants,
      ...selectedAttributes
    };
    
    await addToCart(product.product_id, allSelections, quantity);
    setIsAddingToCart(false);
  };

  const handleWishlist = async () => {
    if (isInWishlist(product.product_id)) {
      await removeFromWishlist(product.product_id);
    } else {
      await addToWishlist(product.product_id);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this product: ${product.name}`,
          url: window.location.href,
        });
      } catch (error) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Product link copied to clipboard.",
    });
  };

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleAttributeChange = (attributeId: string, value: any) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeId]: value
    }));
  };

  const stockInfo = getStockStatus();
  const canAddToCart = inStock && (!hasVariants || getVariantTypes().every(type => selectedVariants[type]));

  return (
    <div className="space-y-6">
      {/* Product Title & Rating */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-tight">
          {product.name}
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating || 0) 
                    ? 'text-yellow-400 fill-current' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-600">
              {product.rating ? `${product.rating}/5` : 'No rating'} ({reviewCount} reviews)
            </span>
          </div>
          <Badge variant={stockInfo.color}>
            {stockInfo.status}
          </Badge>
        </div>

        {/* Price */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(calculatePrice())}
          </span>
          {calculatePrice() !== product.price && (
            <span className="text-xl text-gray-500 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>

      {/* Product Variants with Required Selection */}
      {getVariantTypes().map(type => (
        <div key={type}>
          <h3 className="text-sm font-medium text-gray-900 mb-3 capitalize">
            {type} <span className="text-red-500">*</span>
          </h3>
          {type === 'color' ? (
            <RadioGroup 
              value={selectedVariants[type] || ''} 
              onValueChange={(value) => handleVariantChange(type, value)}
              className="flex gap-3"
            >
              {getVariantsByType(type).map((variant) => (
                <div key={variant.id} className="flex items-center">
                  <RadioGroupItem
                    value={variant.variant_value}
                    id={`${type}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.id}`}
                    className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                      selectedVariants[type] === variant.variant_value 
                        ? 'border-primary border-4 ring-2 ring-primary/20' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: variant.variant_value.toLowerCase() }}
                    title={variant.variant_value}
                    aria-label={`Select ${variant.variant_value} color`}
                  />
                </div>
              ))}
            </RadioGroup>
          ) : (
            <RadioGroup 
              value={selectedVariants[type] || ''} 
              onValueChange={(value) => handleVariantChange(type, value)}
              className="flex gap-2 flex-wrap"
            >
              {getVariantsByType(type).map((variant) => (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.variant_value}
                    id={`${type}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.id}`}
                    className={`px-4 py-2 border rounded-md cursor-pointer transition-all inline-block ${
                      selectedVariants[type] === variant.variant_value
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {variant.variant_value}
                    {variant.price_modifier !== 0 && (
                      <span className="ml-1 text-sm">
                        ({variant.price_modifier > 0 ? '+' : ''}{formatPrice(variant.price_modifier)})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {hasVariants && !selectedVariants[type] && (
            <p className="text-sm text-red-500 mt-1">Please select a {type}</p>
          )}
        </div>
      ))}

      {/* Dynamic Attributes */}
      {dynamicAttributes.length > 0 && (
        <DynamicAttributeSelector
          attributes={dynamicAttributes}
          selectedAttributes={selectedAttributes}
          onAttributeChange={handleAttributeChange}
        />
      )}

      {/* Quantity Selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
        <div className="flex items-center border rounded-lg w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
            aria-label="Decrease quantity"
          >
            -
          </button>
          <span className="px-6 py-2 border-x bg-gray-50 min-w-[60px] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 hover:bg-gray-100 transition-colors"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={!canAddToCart || isAddingToCart}
            className="flex-1 bg-primary hover:bg-primary/90 h-12 text-base font-semibold"
          >
            <ShoppingCart className="mr-2" size={20} />
            {isAddingToCart ? 'Adding...' : 'Add to Cart'}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleWishlist}
            className={`h-12 w-12 ${isInWishlist(product.product_id) ? 'text-red-500 border-red-500' : ''}`}
            aria-label={isInWishlist(product.product_id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={isInWishlist(product.product_id) ? 'fill-current' : ''} size={20} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleShare}
            className="h-12 w-12"
            aria-label="Share product"
          >
            <Share2 size={20} />
          </Button>
        </div>
      </div>

      {/* Variant Selection Notice */}
      {hasVariants && !canAddToCart && inStock && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <p className="text-sm text-yellow-800">
            Please select all product options before adding to cart.
          </p>
        </div>
      )}

      {/* Shipping & Service Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="text-green-600" size={18} />
            <span>Free delivery on orders over KES 10,000</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="text-blue-600" size={18} />
            <span>7-day easy returns</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="text-purple-600" size={18} />
            <span>1-year warranty included</span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Description */}
      {product.description && (
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProductInfoSection;
