
import { memo, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Loader2 } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import LazySection from '@/components/performance/LazySection';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const EnhancedFeaturedProducts = memo(() => {
  const { data: products, isLoading } = useFeaturedProducts();
  const isMobile = isMobileUserAgent();
  
  // State for managing visible products
  const [visibleProductsCount, setVisibleProductsCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Initial product counts
  const initialDesktopCount = 36;
  const initialMobileCount = 30;
  const loadMoreDesktopCount = 18; // Load 18 more products on desktop
  const loadMoreMobileCount = 15; // Load 15 more products on mobile
  
  // Grid layout
  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-6";
  
  // Initialize visible products count
  useEffect(() => {
    setVisibleProductsCount(isMobile ? initialMobileCount : initialDesktopCount);
  }, [isMobile]);
  
  // Desktop "Show More" handler
  const handleShowMore = useCallback(() => {
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleProductsCount(prev => prev + loadMoreDesktopCount);
      setIsLoadingMore(false);
    }, 500);
  }, []);
  
  // Mobile infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isMobile && products && visibleProductsCount < products.length) {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // Trigger when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (!isLoadingMore) {
          setIsLoadingMore(true);
          
          // Simulate loading delay
          setTimeout(() => {
            setVisibleProductsCount(prev => 
              Math.min(prev + loadMoreMobileCount, products.length)
            );
            setIsLoadingMore(false);
          }, 500);
        }
      }
    }
  }, [isMobile, products, visibleProductsCount, isLoadingMore]);
  
  // Add scroll event listener for mobile
  useEffect(() => {
    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, handleScroll]);
  
  const loadingSkeleton = (
    <div className="pb-8 px-0 lg:px-16 bg-gray-50 ">
      {!isMobile && (
        <h2 className="border-b items-center text-gray-600 mx-auto px-4 py-2 text-sm font-semibold">
          <span className='inline-flex px-2'><TrendingUp size={16} /></span>
          HOT DEALS
        </h2>
      )}
      <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
        {Array.from({ length: visibleProductsCount || (isMobile ? initialMobileCount : initialDesktopCount) }).map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return loadingSkeleton;
  }

  // Check if there are more products to show
  const hasMoreProducts = products && visibleProductsCount < products.length;

  return (
    <LazySection fallback={loadingSkeleton}>
      <section className={`px-0 lg:px-1 bg-gray-50 ${!isMobile ? 'pt-4' : ''}`}>
        <div className="*lg:px-0 *md:px-0 *sm:px-0 px-2 bg-white container">
          {/* Products Grid */}
          {!isMobile && (
            <h2 className="border-b items-center text-gray-600 mx-auto px-4 py-2 text-sm font-semibold">
              <span className='inline-flex px-2'><TrendingUp size={16} /></span>
              HOT DEALS
            </h2>
          )}
          
          <div className={`grid ${gridCols} bg-white shadow-sm p-1`}>
            {products?.slice(0, visibleProductsCount).map(product => {
              const productCardData = {
                id: product.product_id,
                name: product.name,
                price: product.price,
                originalPrice: undefined,
                image: (product as any).image_urls?.[0],
                rating: product.rating || 4,
                reviews: 0,
                discount: undefined,
                category: product.categories ?? '',
                inStock: true,
              };
              return (
                <ProductCard 
                  key={product.product_id} 
                  product={productCardData} 
                />
              );
            })}
          </div>

          {/* Desktop Show More Button */}
          {!isMobile && hasMoreProducts && (
            <div className="flex justify-center py-4">
              <button 
                onClick={handleShowMore}
                disabled={isLoadingMore}
                className='flex items-center justify-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200 mx-auto px-6 py-3 bg-white shadow-sm hover:shadow-md border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Show More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
          
          {/* Mobile Loading Indicator */}
          {isMobile && isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center text-gray-600">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading more products...
              </div>
            </div>
          )}
          
          {/* End of products message */}
          {!hasMoreProducts && products && products.length > 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              {isMobile ? "You've reached the end of products" : "All products displayed"}
            </div>
          )}
        </div>
      </section>
    </LazySection>
  );
});

EnhancedFeaturedProducts.displayName = 'EnhancedFeaturedProducts';

export default EnhancedFeaturedProducts;
