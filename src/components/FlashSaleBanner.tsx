import { useAllActiveFlashSaleProducts } from '@/hooks/useFlashSales';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const FlashSaleBanner = () => {
  const isMobile = isMobileUserAgent();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Fetch ALL products from ALL active flash sales
  const pageSize = isMobile ? 6 : 12;
  const { data: productsData, isLoading } = useAllActiveFlashSaleProducts(pageSize);

  useEffect(() => {
    if (!productsData?.earliestEndDate) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(productsData.earliestEndDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [productsData?.earliestEndDate]);

  // Transform product data for ProductCard
  const transformProductData = useCallback((product: any) => ({
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

  const products = useMemo(() => productsData?.products || [], [productsData?.products]);
  const transformedProducts = useMemo(() => 
    products.map(transformProductData), 
    [products, transformProductData]
  );

  // Grid layout configuration - match EnhancedFeaturedProducts
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
      gap: "gap-y-1",
      padding: "p-8"
    };
  }, [isMobile]);

  if (isLoading || !timeLeft || products.length === 0) return null;

  return (
    <section className={`bg-white ${isMobile ? 'mb-4' : 'mb-8 border-t border-b'}`}>
      <div className={`${isMobile ? '' : 'max-w-[1400px] mx-auto'} ${gridConfig.padding}`}>
        {/* Flash Sale Header */}
        <div className={`flex items-center justify-between ${isMobile ? 'mb-3' : 'mb-6'}`}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`bg-red-500 ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg`}>
              <Zap className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-white fill-white`} />
            </div>
            <h2 className={`${isMobile ? 'text-base' : 'text-xl'} font-bold text-gray-900`}>
              Flash Sale
            </h2>
            {!isMobile && <span className="text-gray-600 text-sm">Ends in</span>}
            <div className="flex items-center gap-1">
              <TimeBox value={timeLeft.hours} isMobile={isMobile} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>:</span>
              <TimeBox value={timeLeft.minutes} isMobile={isMobile} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>:</span>
              <TimeBox value={timeLeft.seconds} isMobile={isMobile} />
            </div>
          </div>
          
          <Link 
            to="/flash-sale"
            className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-red-600 hover:underline font-medium`}
          >
            {isMobile ? 'More' : 'View All'}
            <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
          </Link>
        </div>

        {/* Grid Layout Products */}
        <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-white shadow-sm`}>
          {transformedProducts.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TimeBox = ({ value, isMobile }: { value: number; isMobile: boolean }) => (
  <div className={`bg-red-500 text-white rounded ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm'} font-bold ${isMobile ? 'min-w-[24px]' : 'min-w-[28px]'} text-center`}>
    {value.toString().padStart(2, '0')}
  </div>
);

export default FlashSaleBanner;