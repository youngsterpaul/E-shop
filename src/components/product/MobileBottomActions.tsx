import { useState } from 'react';
import { ShoppingCart, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useToast } from '@/hooks/use-toast';
import MobileAddToCartModal from './MobileAddToCartModal';

interface MobileBottomActionsProps {
  product: {
    product_id: string;
    name: string;
    image: string | string[]; // Fixed: handle both string and array
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

const MobileBottomActions = ({
  product,
  selectedVariants,
  requiredVariants,
  onVariantChange,
  calculatePrice
}: MobileBottomActionsProps) => {
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const handleWishlist = async () => {
    try {
      if (isInWishlist(product.product_id)) {
        await removeFromWishlist(product.product_id);
        toast({
          title: "Removed from Wishlist",
          description: "Item removed from your wishlist.",
        });
      } else {
        await addToWishlist(product.product_id);
        toast({
          title: "Added to Wishlist",
          description: "Item added to your wishlist.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          url: window.location.href,
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Product link copied to clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to share at this time.",
        variant: "destructive"
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  return (
    <>
      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 //md:hidden shadow-lg">
        <div className="flex items-center gap-3">
          {/* Price display */}
          <div className="flex-1">
            <div className="text-lg font-bold text-orange-500">
              {formatPrice(calculatePrice())}
            </div>
            {product.originalPrice && (
              <div className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleWishlist}
              className={`p-2 transition-colors ${
                isInWishlist(product.product_id) 
                  ? 'text-red-500 border-red-500 bg-red-50' 
                  : 'hover:text-red-500 hover:border-red-500'
              }`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.product_id) ? 'fill-current' : ''}`} />
            </Button>
                       
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare} 
              className="p-2 hover:bg-gray-50"
            >
              <Share2 className="h-5 w-5" />
            </Button>
                       
            <Button
              onClick={() => setIsAddToCartModalOpen(true)}
              disabled={!product.inStock}
              className="px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold shadow-lg disabled:shadow-none"
              size="sm"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Add to Cart Modal */}
      <MobileAddToCartModal
        isOpen={isAddToCartModalOpen}
        onClose={() => setIsAddToCartModalOpen(false)}
        product={product}
        selectedVariants={selectedVariants}
        requiredVariants={requiredVariants}
        onVariantChange={onVariantChange}
        calculatePrice={calculatePrice}
      />
    </>
  );
};

export default MobileBottomActions;