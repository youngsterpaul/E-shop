import { useState } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileAddToCartModal from './MobileAddToCartModal';
import MobileBuyNowModal from './MobileBuyNowModal';

interface MobileBottomActionsProps {
  product: {
    product_id: string;
    name: string;
    image: string | string[];
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
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);

  return (
    <>
      {/* Fixed bottom action bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-background border-t border-gray-200 p-2 z-40 shadow-lg"
        style={{
          paddingBottom: `calc(4px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Action buttons */}
          <div className="flex gap-3 flex-1">
            <Button
              onClick={() => setIsAddToCartModalOpen(true)}
              disabled={!product.inStock}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold shadow-lg disabled:shadow-none"
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>

            <Button
              onClick={() => setIsBuyNowModalOpen(true)}
              disabled={!product.inStock}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-gray-300 text-white font-semibold shadow-lg disabled:shadow-none"
            >
              <Zap className="mr-2 h-5 w-5" />
              Buy Now
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

      {/* Mobile Buy Now Modal */}
      <MobileBuyNowModal
        isOpen={isBuyNowModalOpen}
        onClose={() => setIsBuyNowModalOpen(false)}
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
