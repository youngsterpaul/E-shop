import { useAllActiveFlashSaleProducts } from '@/hooks/useFlashSales';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, ChevronRight, Clock } from 'lucide-react';
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

  if (isLoading || !timeLeft || products.length === 0) return null;

  return (
    <section className={`bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-xl ${isMobile ? 'mx-2 rounded-lg' : ''} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-2.5' : 'px-6 py-4'}`}>
        <div className="flex items-center gap-2">
          <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-white/20 rounded-lg backdrop-blur-sm`}>
            <Zap className={`${isMobile ? 'h-3.5 w-3.5' : 'h-5 w-5'} text-white fill-white`} />
          </div>
          <div>
            <h2 className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold text-white`}>
              Flash Sale
            </h2>
            <div className="flex items-center gap-1.5">
              <Clock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-white/80`} />
              <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-white/80`}>Ends in</span>
              <div className="flex items-center gap-1">
                <TimeBox value={timeLeft.hours} isMobile={isMobile} />
                <span className="text-white/80 text-sm font-bold">:</span>
                <TimeBox value={timeLeft.minutes} isMobile={isMobile} />
                <span className="text-white/80 text-sm font-bold">:</span>
                <TimeBox value={timeLeft.seconds} isMobile={isMobile} />
              </div>
            </div>
          </div>
        </div>
        
        <Link 
          to="/flash-sale"
          className={`flex items-center gap-1 ${isMobile ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5'} bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors backdrop-blur-sm`}
        >
          {isMobile ? 'More' : 'View All'}
          <ChevronRight className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
        </Link>
      </div>

      {/* Products Grid */}
      <div className={`bg-card ${isMobile ? 'p-2' : 'p-4'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3'}`}>
          {transformedProducts.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

const TimeBox = ({ value, isMobile }: { value: number; isMobile: boolean }) => (
  <span className={`bg-white/25 text-white backdrop-blur-sm rounded ${isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-sm'} font-bold ${isMobile ? 'min-w-[22px]' : 'min-w-[28px]'} text-center inline-block`}>
    {value.toString().padStart(2, '0')}
  </span>
);

export default FlashSaleBanner;