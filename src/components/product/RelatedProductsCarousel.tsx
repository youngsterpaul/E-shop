import { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import LazySection from '@/components/performance/LazySection';
import { useOptimizedRelatedProducts } from '@/hooks/useOptimizedRelatedProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import ProductSkeleton from '../products/ProductSkeleton';

interface GemFashionStyleProps {
  currentProduct: {
    id: string;
    category: string;
  };
}

const INITIAL_MOBILE = 4;
const INITIAL_DESKTOP = 6;
const LOAD_MORE_COUNT = 6;

const GemFashionStyle = memo(({ currentProduct }: GemFashionStyleProps) => {
  const isMobile = isMobileUserAgent();
  const initialCount = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
  const [visibleCount, setVisibleCount] = useState(initialCount);
  
  // Database logic left untouched
  const { data: products = [], isLoading, isError, error } = useOptimizedRelatedProducts(
    currentProduct.category,
    currentProduct.id
  );

  const transformedProducts = useMemo(
    () =>
      products.map((product) => ({
        id: product.product_id,
        name: product.name,
        price: product.price || 0,
        originalPrice: product.discount_price && product.discount_price < (product.price || 0) ? product.price : undefined,
        image: product.image_urls?.[0] || '/placeholder-image.webp',
        rating: product.rating || 4,
        reviews_count: product.reviews_count || 0,
        discount: undefined,
        category: product.categories || '',
        inStock: true,
      })),
    [products]
  );

  const visibleProducts = useMemo(
    () => transformedProducts.slice(0, visibleCount),
    [transformedProducts, visibleCount]
  );

  const hasMore = visibleCount < transformedProducts.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + LOAD_MORE_COUNT);
  }, []);

  const loadingSkeleton = (
    <div className={`${isMobile ? 'px-2' : 'p-6'}`}>
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
        {Array.from({ length: isMobile ? 4 : 6 }).map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  );

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-rose-100 bg-rose-50/30 rounded-xl">
        <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
        <h3 className="text-base font-semibold text-stone-800 mb-1">Failed to load curated collection</h3>
        <p className="text-sm text-stone-500 text-center mb-4">
          {error?.message || 'Something went wrong.'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="border-stone-300 text-stone-700 hover:bg-stone-50">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <LazySection fallback={loadingSkeleton}>{loadingSkeleton}</LazySection>;
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <LazySection fallback={loadingSkeleton}>
      {/* Restyled wrapper with a subtle luxury border, shadow, and soft background */}
      <div className={`${isMobile ? 'mt-6' : 'mt-12'} bg-gradient-to-b from-stone-50/50 to-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden`}>
        
        {/* Header restyled for a premium fashion brand vibe */}
        <div className={`flex items-center justify-between ${isMobile ? 'px-4 py-4' : 'px-8 py-5'} border-b border-stone-100 bg-white`}>
          <div>
            <div className="flex items-center gap-1.5 text-amber-600/90 tracking-wider uppercase text-[10px] font-bold mb-0.5">
              <Sparkles className="h-3 w-3 fill-amber-500/20" />
              <span>Gem Fashion Style</span>
            </div>
            <h2 className={`font-serif font-medium text-stone-900 tracking-tight ${isMobile ? 'text-base' : 'text-2xl'}`}>
              Complete Your Look
            </h2>
            <p className="text-xs text-stone-400 italic mt-0.5">
              {transformedProducts.length} handpicked piece{transformedProducts.length !== 1 ? 's' : ''} just for you
            </p>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className={`${isMobile ? 'px-3 py-4' : 'p-8'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-6'}`}>
            {visibleProducts.map((product) => (
              <div key={product.id} className="transition-all duration-300 hover:-translate-y-1 hover:shadow-md rounded-lg overflow-hidden">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Load More Button - Styled with a sleek fashion-house aesthetic */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                onClick={handleLoadMore}
                className="gap-2 min-w-[180px] border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white transition-colors duration-300 font-medium tracking-wide text-xs uppercase"
              >
                Discover More
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </LazySection>
  );
});

GemFashionStyle.displayName = 'GemFashionStyle';
export default GemFashionStyle;