import { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
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
  
  // Use ref to track loading state to prevent multiple fetches
  const isLoadingMore = useRef(false);
  const lastScrollY = useRef(0);
  
  // Memoized values
  const products = useMemo(() => data?.products || [], [data?.products]);
  const totalCount = useMemo(() => data?.totalCount || 0, [data?.totalCount]);
  
  // Grid layout configuration
  const gridConfig = useMemo(() => {
    if (isMobile) {
      return {
        cols: "grid-cols-2",
        gap: "gap-2",
        padding: "p-2"
      };
    }
    return {
      cols: "grid-cols-6",
      gap: "gap-1",
      padding: "p-8"
    };
  }, [isMobile]);
  
  // Optimized scroll handler with better throttling and debouncing
  const handleScroll = useCallback(() => {
    if (!isMobile || !hasNextPage || isFetchingNextPage || isLoadingMore.current) return;
    
    const currentScrollY = window.scrollY;
    
    // Only check if scrolling down
    if (currentScrollY <= lastScrollY.current) {
      lastScrollY.current = currentScrollY;
      return;
    }
    lastScrollY.current = currentScrollY;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    const threshold = 400; // Increased threshold for earlier loading
    
    const nearBottom = currentScrollY + clientHeight >= scrollHeight - threshold;
    
    if (nearBottom && !isLoadingMore.current) {
      isLoadingMore.current = true;
      fetchNextPage().finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [isMobile, hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // More efficient throttle implementation
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
  
  // Attach scroll listener for mobile infinite scroll
  useEffect(() => {
    if (!isMobile) return;
    
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    return () => window.removeEventListener('scroll', throttledScrollHandler);
  }, [isMobile, throttledScrollHandler]);
  
  // Load more handler for desktop
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMore.current) {
      isLoadingMore.current = true;
      fetchNextPage().finally(() => {
        isLoadingMore.current = false;
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Memoized transform function to prevent recreating on every render
  const transformProductData = useCallback((product) => ({
    id: product.product_id,
    name: product.name,
    price: product.price,
    originalPrice: undefined,
    image: product.image_urls?.[0] || '/placeholder-image.webp',
    rating: product.rating || 4,
    reviews: 0,
    discount: undefined,
    category: product.categories || '',
    inStock: (product.stock || 0) > 0,
  }), []);
  
  // Memoize transformed products to prevent recalculation
  const transformedProducts = useMemo(() => 
    products.map(transformProductData), 
    [products, transformProductData]
  );
  
  // Loading skeleton
  const loadingSkeleton = useMemo(() => (
    <div className={`${gridConfig.padding} bg-gray-50`}>
      {!isMobile && (
        <div className="border flex items-center text-gray-600 mx-auto px-4 py-2 text-sm font-semibold bg-white">
          <TrendingUp size={16} className="mr-2" />
          HOT DEALS
        </div>
      )}
      <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-white shadow-sm`}>
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    </div>
  ), [gridConfig, pageSize, isMobile]);
  
  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load products
        </h3>
        <p className="text-gray-600 text-center mb-4">
          {error?.message || 'Something went wrong while fetching products.'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="flex items-center"
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  // Initial loading state
  if (isLoading) {
    return (
      <LazySection fallback={loadingSkeleton}>
        {loadingSkeleton}
      </LazySection>
    );
  }
  
  // No products state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No featured products found
          </h3>
          <p className="text-gray-600">
            Check back later for exciting deals and offers.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <LazySection fallback={loadingSkeleton}>
      <section className={`${gridConfig.padding} shadow-sm bg-white ${!isMobile ? 'pt-4 pb-4' : 'mb-12'}`}>
        <div className={`bg-white`}>
          {/* Section Header - Desktop only */}
          {!isMobile && (
            <div className="my-4 border-b flex items-center text-gray-600 /mx-auto /px-4 py-2 text-xl font-bold bg-white">
              <TrendingUp size={16} className="mr-2" />
              HOT DEALS
              {totalCount > 0 && (
                <span className="ml-auto text-xs text-gray-500">
                  Showing {products.length} of {totalCount} products
                </span>
              )}
            </div>
          )}
          
          {/* Products Grid */}
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap} ${!isMobile ? 'bg-white' : 'bg-gray-50'}`}>
            {transformedProducts.map((product, index) => (
              <ProductCard 
                key={`${product.id}-${index}`}
                product={product}
              />
            ))}
          </div>

          {/* Desktop Load More Button */}
          {!isMobile && hasNextPage && (
            <div className="flex justify-center py-6">
              <Button 
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                variant="outline"
                className="flex items-center px-6 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-md"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Products
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {/* Mobile Loading Indicator */}
          {isMobile && isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <div className="flex items-center text-gray-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more products...
              </div>
            </div>
          )}
        </div>
      </section>
    </LazySection>
  );
});

EnhancedFeaturedProducts.displayName = 'EnhancedFeaturedProducts';

export default EnhancedFeaturedProducts;
