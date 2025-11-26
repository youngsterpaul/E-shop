import { useActiveFlashSales, useFlashSaleProductsWithDetails } from '@/hooks/useFlashSales';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clock, Zap, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import ProductCard from '@/components/ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const FlashSaleBanner = () => {
  const isMobile = isMobileUserAgent();
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const activeSale = flashSales?.[0]; // Show first active flash sale
  
  // Fetch products for the active flash sale
  const pageSize = isMobile ? 6 : 12;
  const { data: productsData, isLoading: productsLoading } = useFlashSaleProductsWithDetails(
    activeSale?.id,
    pageSize
  );

  useEffect(() => {
    if (!activeSale) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(activeSale.end_date).getTime();
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
  }, [activeSale]);

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
      gap: "gap-y-1",
      padding: "p-8"
    };
  }, [isMobile]);

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

  if (isLoading || !activeSale || !timeLeft) return null;
  
  // Don't show if no products
  if (!productsLoading && products.length === 0) return null;

  return (
    <section className="mb-8">
      {/* Flash Sale Header Banner */}
      <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 border-0 overflow-hidden relative mb-6">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  {activeSale.title}
                </h2>
                {activeSale.description && (
                  <p className="text-white/90 mt-1">{activeSale.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-white">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-medium">Ends in:</span>
              </div>
              <div className="flex gap-2">
                <TimeUnit value={timeLeft.hours} label="Hours" />
                <TimeUnit value={timeLeft.minutes} label="Mins" />
                <TimeUnit value={timeLeft.seconds} label="Secs" />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
              {activeSale.discount_type === 'percentage'
                ? `${activeSale.discount_value}% OFF`
                : `KES ${activeSale.discount_value} OFF`}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      {productsLoading ? (
        <div className={`${gridConfig.padding} bg-white`}>
          {!isMobile && (
            <div className="my-4 border-b flex items-center text-gray-600 py-2 text-xl font-bold bg-white">
              <TrendingUp size={16} className="mr-2" />
              FLASH SALE ITEMS
            </div>
          )}
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-white shadow-sm`}>
            {Array.from({ length: isMobile ? 6 : 12 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="h-40 bg-gray-200 shimmer" />
                <div className="p-2 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-200 rounded shimmer" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`${gridConfig.padding} ${!isMobile ? 'pt-4 pb-4 shadow-sm bg-white' : ''}`}>
          {!isMobile && (
            <div className="my-4 border-b flex items-center text-gray-600 py-2 text-xl font-bold bg-white">
              <TrendingUp size={16} className="mr-2" />
              FLASH SALE ITEMS
              {productsData?.totalCount && productsData.totalCount > 0 && (
                <span className="ml-auto text-xs text-gray-500">
                  Showing {products.length} of {productsData.totalCount} products
                </span>
              )}
            </div>
          )}
          
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
            {transformedProducts.map((product, index) => (
              <ProductCard 
                key={`${product.id}-${index}`}
                product={product}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 min-w-[60px]">
    <span className="text-2xl font-bold text-white">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-xs text-white/80">{label}</span>
  </div>
);

export default FlashSaleBanner;