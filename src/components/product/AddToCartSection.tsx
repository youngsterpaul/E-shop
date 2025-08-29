
import { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

interface AddToCartSectionProps {
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

const AddToCartSection = ({ 
  product, 
  selectedVariants, 
  requiredVariants,
  quantity,
  onQuantityChange,
  className = ''
}: AddToCartSectionProps) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
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

  const handleAddToCart = async () => {
    if (!inStock) {
      toast({
        title: "Out of Stock",
        description: "This item is currently out of stock",
        variant: "destructive"
      });
      return;
    }

    if (!validateVariantSelection()) {
      return;
    }

    setIsAddingToCart(true);
    
    try {
      await addToCart(product.product_id, selectedVariants, quantity);
      
      // Show success state
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      toast({
        title: "Added to cart!",
        description: `${product.name.split('(')[0].trim()} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    } finally {
      setIsAddingToCart(false);
    }
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
          title: product.name.split('(')[0].trim(),
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
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || isAddingToCart}
          className={`flex-1 h-12 text-base font-semibold transition-all duration-200 ${
            showSuccess 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-orange-500 hover:bg-orange-600'
          }`}
          size="lg"
        >
          {showSuccess ? (
            <>
              <Check className="mr-2 h-5 w-5" />
              Added!
            </>
          ) : isAddingToCart ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={handleWishlist}
          className={`h-12 w-auto px-4 flex items-center gap-2 ${
            isInWishlistState 
              ? 'text-red-500 border-red-500 bg-red-50 hover:bg-red-100' 
              : 'hover:text-red-500 hover:border-red-500'
          }`}
        >
          <Heart className={`h-5 w-5 ${isInWishlistState ? 'fill-current' : ''}`} />
          {isInWishlistState ? 'Wishlisted' : 'Add to Wishlist'}
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
    </div>
  );
};

export default AddToCartSection;
