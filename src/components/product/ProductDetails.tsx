<<<<<<< HEAD

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star } from 'lucide-react';
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

export interface ProductDetailsProps {
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
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  
  // Get dynamic attributes for this product's category
  const dynamicAttributes = getCartDisplayAttributes(product.category, product.subcategory);
  const inStock = product.inStock !== undefined ? product.inStock : true;
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

  const handleShare = () => {
    navigator.share?.({
      title: product.name,
      url: window.location.href,
    }) || toast({
      title: "Link Copied",
      description: "Product link copied to clipboard.",
    });
  };

  const handleVariantChange = (type: string, value: string) => {
    console.log('Variant change:', { type, value });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-600">({product.reviews} reviews)</span>
          </div>
          <Badge variant={inStock ? "default" : "destructive"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(calculatePrice())}
          </span>
          {product.originalPrice && (
            <span className="text-xl text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Product Variants (Database-driven) with Required Selection */}
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
                    id={`${type}-${variant.variant_value}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.variant_value}-${variant.id}`}
                    className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                      selectedVariants[type] === variant.variant_value 
                        ? 'border-primary border-4 ring-2 ring-primary/20' 
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
              onValueChange={(value) => handleVariantChange(type, value)}
              className="flex gap-2 flex-wrap"
            >
              {getVariantsByType(type).map((variant) => (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.variant_value}
                    id={`${type}-${variant.variant_value}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.variant_value}-${variant.id}`}
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
        </div>
      ))}

      {/* Dynamic Product Attributes */}
      {dynamicAttributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Options</h3>
          <DynamicAttributeSelector
            attributes={dynamicAttributes}
            selectedAttributes={selectedAttributes}
            onAttributeChange={handleAttributeChange}
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
        <div className="flex items-center border rounded-md w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-4 py-2 border-x">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons - Always enabled add to cart */}
      <div className="flex gap-4">
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className="flex-1 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <ShoppingCart className="mr-2" size={20} />
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          className={isInWishlist(product.product_id) ? 'text-red-500 border-red-500' : ''}
        >
          <Heart className={isInWishlist(product.product_id) ? 'fill-current' : ''} size={20} />
        </Button>
        
        <Button variant="outline" size="lg" onClick={handleShare}>
          <Share2 size={20} />
        </Button>
      </div>

      {/* Product Description */}
      {product.description && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Product Attributes Display */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <span className="font-medium text-gray-900 capitalize">{key}: </span>
                  <span className="text-gray-700">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetails;
=======

import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Star } from 'lucide-react';
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

export interface ProductDetailsProps {
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
}

const ProductDetails = ({ product }: ProductDetailsProps) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, any>>({});
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { variants, getVariantsByType, getVariantTypes } = useProductVariants(product.product_id);
  
  // Get dynamic attributes for this product's category
  const dynamicAttributes = getCartDisplayAttributes(product.category, product.subcategory);
  const inStock = product.inStock !== undefined ? product.inStock : true;
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

  const handleShare = () => {
    navigator.share?.({
      title: product.name,
      url: window.location.href,
    }) || toast({
      title: "Link Copied",
      description: "Product link copied to clipboard.",
    });
  };

  const handleVariantChange = (type: string, value: string) => {
    console.log('Variant change:', { type, value });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {product.name}
        </h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-600">({product.reviews} reviews)</span>
          </div>
          <Badge variant={inStock ? "default" : "destructive"}>
            {inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <span className="text-3xl font-bold text-primary">
            {formatPrice(calculatePrice())}
          </span>
          {product.originalPrice && (
            <span className="text-xl text-gray-500 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Product Variants (Database-driven) with Required Selection */}
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
                    id={`${type}-${variant.variant_value}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.variant_value}-${variant.id}`}
                    className={`w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                      selectedVariants[type] === variant.variant_value 
                        ? 'border-primary border-4 ring-2 ring-primary/20' 
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
              onValueChange={(value) => handleVariantChange(type, value)}
              className="flex gap-2 flex-wrap"
            >
              {getVariantsByType(type).map((variant) => (
                <div key={variant.id}>
                  <RadioGroupItem
                    value={variant.variant_value}
                    id={`${type}-${variant.variant_value}-${variant.id}`}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`${type}-${variant.variant_value}-${variant.id}`}
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
        </div>
      ))}

      {/* Dynamic Product Attributes */}
      {dynamicAttributes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Options</h3>
          <DynamicAttributeSelector
            attributes={dynamicAttributes}
            selectedAttributes={selectedAttributes}
            onAttributeChange={handleAttributeChange}
          />
        </div>
      )}

      {/* Quantity */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quantity</h3>
        <div className="flex items-center border rounded-md w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-3 py-2 hover:bg-gray-100"
          >
            -
          </button>
          <span className="px-4 py-2 border-x">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-3 py-2 hover:bg-gray-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons - Always enabled add to cart */}
      <div className="flex gap-4">
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className="flex-1 bg-primary hover:bg-primary/90"
          size="lg"
        >
          <ShoppingCart className="mr-2" size={20} />
          {isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          className={isInWishlist(product.product_id) ? 'text-red-500 border-red-500' : ''}
        >
          <Heart className={isInWishlist(product.product_id) ? 'fill-current' : ''} size={20} />
        </Button>
        
        <Button variant="outline" size="lg" onClick={handleShare}>
          <Share2 size={20} />
        </Button>
      </div>

      {/* Product Description */}
      {product.description && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Product Attributes Display */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(product.attributes).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <span className="font-medium text-gray-900 capitalize">{key}: </span>
                  <span className="text-gray-700">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductDetails;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
