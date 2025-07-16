
import { useState } from 'react';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWishlist } from '@/hooks/useWishlist';
import OptimizedAddToCart from './OptimizedAddToCart';

interface OptimizedAddToCartSectionProps {
  product: {
    product_id: string;
    name: string;
    price: number;
    stock?: number;
  };
  selectedVariants: Record<string, string>;
  requiredVariants: string[];
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

const OptimizedAddToCartSection = ({ 
  product, 
  selectedVariants, 
  requiredVariants,
  quantity,
  onQuantityChange,
  className = ''
}: OptimizedAddToCartSectionProps) => {
  const { toast } = useToast();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const inStock = (product.stock || 0) > 0;
  const isInWishlistState = isInWishlist(product.product_id);

  const validateVariantSelection = () => {
    const missingVariants = requiredVariants.filter(
      variantType => !selectedVariants[variantType]
    );
    
    if (missingVariants.length > 0) {
      toast({
        title: "Please select all options",
        description: `Please choose: ${missingVariants.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleWishlist = async () => {
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product.product_id);
        toast({
          title: "Removed from wishlist",
          description: "Item has been removed from your wishlist"
        });
      } else {
        await addToWishlist(product.product_id);
        toast({
          title: "Added to wishlist",
          description: "Item has been added to your wishlist"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard"
      });
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stock Status */}
      <div className="flex items-center gap-2">
        <Badge variant={inStock ? "default" : "destructive"}>
          {inStock ? "In Stock" : "Out of Stock"}
        </Badge>
        {product.stock && product.stock <= 10 && inStock && (
          <Badge variant="outline" className="text-orange-600 border-orange-300">
            Only {product.stock} left
          </Badge>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
        <div className="flex items-center border rounded-md w-fit">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            className="h-10 w-10 p-0 hover:bg-gray-100"
            disabled={quantity <= 1}
          >
            -
          </Button>
          <span className="h-10 px-4 flex items-center justify-center border-x min-w-[3rem]">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuantityChange(quantity + 1)}
            className="h-10 w-10 p-0 hover:bg-gray-100"
            disabled={product.stock ? quantity >= product.stock : false}
          >
            +
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <OptimizedAddToCart
          productId={product.product_id}
          productName={product.name}
          variantSelections={selectedVariants}
          quantity={quantity}
          disabled={!inStock || !validateVariantSelection()}
          className="flex-1"
          size="lg"
        />
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          className={`h-12 w-12 p-0 ${
            isInWishlistState 
              ? 'text-red-500 border-red-500 bg-red-50 hover:bg-red-100' 
              : 'hover:text-red-500 hover:border-red-500'
          }`}
        >
          <Heart 
            className={`h-5 w-5 ${isInWishlistState ? 'fill-current' : ''}`} 
          />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleShare}
          className="h-12 w-12 p-0"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Additional Info */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>✓ Free shipping on orders over KES 5,000</p>
        <p>✓ 30-day return policy</p>
        <p>✓ Secure payment options</p>
      </div>
    </div>
  );
};

export default OptimizedAddToCartSection;
