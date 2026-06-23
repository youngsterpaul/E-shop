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
        <div className="flex gap-3 flex-1">
          <Button
            onClick={() => setIsAddToCartModalOpen(true)}
            disabled={!product.inStock}
            variant="outline"
            className="flex-1 border-gray-300 text-gray-800 font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>

          <Button
            onClick={() => setIsBuyNowModalOpen(true)}
            disabled={!product.inStock}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
          >
            <Zap className="mr-2 h-4 w-4" />
            Buy Now
          </Button>
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
