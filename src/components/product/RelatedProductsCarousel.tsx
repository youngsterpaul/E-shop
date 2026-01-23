import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
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

const RelatedProductsCarousel = memo(({ currentProduct }: RelatedProductsCarouselProps) => {
  const isMobile = isMobileUserAgent();
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
        originalPrice: undefined,
        image: product.image_urls?.[0] || '/placeholder-image.webp',
        rating: product.rating || 4,
        reviews_count: product.reviews_count || 0,
        discount: undefined,
        category: product.categories || '',
        inStock: true,
      })),
    [products]
  );

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
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load related products</h3>
        <p className="text-muted-foreground text-center mb-4">
          {error?.message || 'Something went wrong while fetching related products.'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return <LazySection fallback={loadingSkeleton}>{loadingSkeleton}</LazySection>;
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">No related products</h3>
        <p className="text-muted-foreground">Check back later for more recommendations.</p>
      </div>
    );
  }

  return (
    <LazySection fallback={loadingSkeleton}>
      <div className="mt-12 bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-semibold text-foreground text-lg">You might also like</h2>
        </div>

        <div className={`${isMobile ? 'px-2 pb-4' : 'p-6'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
            {transformedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </LazySection>
  );
});

RelatedProductsCarousel.displayName = 'RelatedProductsCarousel';
export default RelatedProductsCarousel;
