import { memo, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, ChevronDown } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import LazySection from '@/components/performance/LazySection';
import { useOptimizedRelatedProducts } from '@/hooks/useOptimizedRelatedProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import ProductSkeleton from '../products/ProductSkeleton';

interface RelatedProductsCarouselProps {
  currentProduct: {
    id: string;
    category: string;
  };
}

const INITIAL_MOBILE = 4;
const INITIAL_DESKTOP = 6;
const LOAD_MORE_COUNT = 6;

const RelatedProductsCarousel = memo(({ currentProduct }: RelatedProductsCarouselProps) => {
  const isMobile = isMobileUserAgent();
  const initialCount = isMobile ? INITIAL_MOBILE : INITIAL_DESKTOP;
  const [visibleCount, setVisibleCount] = useState(initialCount);
  
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
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Failed to load related products</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          {error?.message || 'Something went wrong.'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
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
      <div className={`${isMobile ? 'mt-6' : 'mt-10'} bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden`}>
        <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-3' : 'px-6 py-4'} border-b border-border/50`}>
          <div>
            <h2 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
              You might also like
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {transformedProducts.length} related product{transformedProducts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className={`${isMobile ? 'px-2 py-3' : 'p-6'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-2.5' : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'}`}>
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <Button
                variant="outline"
                size={isMobile ? 'sm' : 'default'}
                onClick={handleLoadMore}
                className="gap-2 min-w-[160px]"
              >
                Show More
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </LazySection>
  );
});

RelatedProductsCarousel.displayName = 'RelatedProductsCarousel';
export default RelatedProductsCarousel;
