

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  return (
    <>
      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 md:hidden">
        <div className="flex items-center gap-3">
          {/* Price display */}
          <div className="flex-1">
            <div className="text-lg font-bold text-primary">
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
              className={`p-2 ${isInWishlist(product.product_id) ? 'text-red-500 border-red-500' : ''}`}
            >
              <Heart className={`h-5 w-5 ${isInWishlist(product.product_id) ? 'fill-current' : ''}`} />
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleShare} className="p-2">
              <Share2 className="h-5 w-5" />
            </Button>
            
            <Button
              onClick={() => setIsAddToCartModalOpen(true)}
              disabled={!product.inStock}
              className="px-6 bg-primary hover:bg-primary/90"
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