import { useState } from 'react';
import { ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MobileAddToCartModal from './MobileAddToCartModal';
import MobileBuyNowModal from './MobileBuyNowModal';

interface GemFashionStyleProps {
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

const GemFashionStyle = ({
  product,
  selectedVariants,
  requiredVariants,
  onVariantChange,
  calculatePrice
}: GemFashionStyleProps) => {
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [isBuyNowModalOpen, setIsBuyNowModalOpen] = useState(false);

  return (
    <>
      {/* Fixed bottom action bar - Refined Fashion Restyle */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-stone-100 p-3 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]"
        style={{
          paddingBottom: `calc(12px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="flex gap-3 w-full max-w-md mx-auto">
          {/* Add To Cart - Elegant Rose Gold / Nude Aesthetic */}
          <Button
            onClick={() => setIsAddToCartModalOpen(true)}
            disabled={!product.inStock}
            variant="outline"
            className="flex-1 border-stone-200 text-stone-800 font-semibold tracking-wide text-xs uppercase bg-stone-50/50 hover:bg-stone-100 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 h-12 rounded-none"
          >
            <ShoppingCart className="mr-2 h-4 w-4 stroke-[1.5]" />
            Add to Cart
          </Button>

          {/* Buy Now - High-End Deep Charcoal / Onyx Black Statement */}
          <Button
            onClick={() => setIsBuyNowModalOpen(true)}
            disabled={!product.inStock}
            className="flex-1 bg-stone-900 hover:bg-stone-950 text-amber-50 font-semibold tracking-widest text-xs uppercase active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 h-12 rounded-none shadow-sm"
          >
            <Zap className="mr-2 h-4 w-4 fill-amber-200 text-amber-200 stroke-[1.5]" />
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

export default GemFashionStyle;