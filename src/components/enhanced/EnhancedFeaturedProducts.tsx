import { memo, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Flame, Loader2, AlertCircle } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import LazySection from '@/components/performance/LazySection';
import { useFeaturedProducts, PAGINATION_CONFIG } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const EnhancedFeaturedProducts = memo(() => {
  const isMobile = isMobileUserAgent();
  const pageSize = isMobile ? PAGINATION_CONFIG.MOBILE_PAGE_SIZE : PAGINATION_CONFIG.DESKTOP_PAGE_SIZE;
  
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeaturedProducts(pageSize);
  
  const isLoadingMore = useRef(false);
  const lastScrollY = useRef(0);
  
  const products = useMemo(() => data?.products || [], [data?.products]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data?.totalCount]);
  
  // Optimized scroll handler
  const handleScroll = useCallback(() => {
    if (!isMobile || !hasNextPage || isFetchingNextPage || isLoadingMore.current) return;
    
    const currentScrollY = window.scrollY;
    if (currentScrollY <= lastScrollY.current) {
      lastScrollY.current = currentScrollY;
      return;
    }
    lastScrollY.current = currentScrollY;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const threshold = 400;
    
    const nearBottom = currentScrollY + clientHeight >= scrollHeight - threshold;
    
    if (nearBottom && !isLoadingMore.current) {
      isLoadingMore.current = true;
      fetchNextPage().finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [isMobile, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const throttledScrollHandler = useMemo(() => {
    let ticking = false;
    return () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
  }, [handleScroll]);
  
  useEffect(() => {
    if (!isMobile) return;
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, [isMobile, throttledScrollHandler]);
  
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMore.current) {
      isLoadingMore.current = true;
      fetchNextPage().finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  const transformProductData = useCallback((product) => ({
    id: product.product_id,
    name: product.name,
    price: product.price,
    originalPrice: undefined,
    image: product.image_urls?.[0] || '/placeholder-image.webp',
    rating: product.rating || 4,
    reviews_count: product.reviews_count || 0,
    discount: undefined,
    category: product.categories || '',
    inStock: (product.stock || 0) > 0,
  }), []);
  
  const transformedProducts = useMemo(() => 
    products.map(transformProductData), 
    [products, transformProductData]
  );
  
  // Loading skeleton with modern design
  const loadingSkeleton = (
    <div className={`${isMobile ? 'px-2' : ''}`}>
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'}`}>
        {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse">
            <div className="aspect-square bg-muted" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
              <div className="h-5 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load products</h3>
        <p className="text-muted-foreground text-center mb-4">
          {error?.message || 'Something went wrong while fetching products.'}
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
        <h3 className="text-lg font-semibold text-foreground mb-2">No products found</h3>
        <p className="text-muted-foreground">Check back later for exciting deals and offers.</p>
      </div>
    );
  }
  
  return (
    <LazySection fallback={loadingSkeleton}>
      <div className={`bg-card rounded-xl ${isMobile ? 'rounded-none' : 'shadow-sm'}`}>
        {/* Section Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-3' : 'px-6 py-5 border-b border-border'}`}>
          <div className="flex items-center gap-2">
            <div className={`${isMobile ? 'p-1' : 'p-1.5'} bg-primary/10 rounded-lg`}>
              <Flame className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
            </div>
            <h2 className={`font-semibold text-foreground ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Hot Deals
            </h2>
          </div>
          {!isMobile && hasNextPage && (
            <Button variant="ghost" size="sm" onClick={handleLoadMore} className="text-primary hover:text-primary/80">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Products Grid */}
        <div className={`${isMobile ? 'px-2 pb-4' : 'p-6'}`}>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-6 gap-4'}`}>
            {transformedProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        </div>

        {/* Desktop Load More */}
        {!isMobile && hasNextPage && (
          <div className="flex justify-center pb-6">
            <Button 
              onClick={handleLoadMore}
              disabled={isFetchingNextPage}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Load More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Mobile Loading */}
        {isMobile && isFetchingNextPage && (
          <div className="grid grid-cols-2 gap-3 px-2 pb-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LazySection>
  );
});

EnhancedFeaturedProducts.displayName = 'EnhancedFeaturedProducts';

export default EnhancedFeaturedProducts;