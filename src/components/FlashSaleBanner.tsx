import { useActiveFlashSales, useFlashSaleProductsWithDetails } from '@/hooks/useFlashSales';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';

const FlashSaleBanner = () => {
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const activeSale = flashSales?.[0]; // Show first active flash sale
  
  // Fetch products for the active flash sale - limit to 10 for horizontal scroll
  const { data: productsData, isLoading: productsLoading } = useFlashSaleProductsWithDetails(
    activeSale?.id,
    10
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
    <section className="bg-white py-4 mb-6 border-t border-b">
      <div className="max-w-[1400px] mx-auto px-4">
        {/* Flash Sale Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              Flash Sale
            </h2>
            <span className="hidden md:inline text-gray-600 text-sm">Ends in</span>
            <div className="flex items-center gap-1">
              <TimeBox value={timeLeft.hours} />
              <span className="text-gray-600">:</span>
              <TimeBox value={timeLeft.minutes} />
              <span className="text-gray-600">:</span>
              <TimeBox value={timeLeft.seconds} />
            </div>
          </div>
          
          <Link 
            to="/flash-sale"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View more
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Horizontal Scrollable Products */}
        {productsLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-none w-[180px] md:w-[200px] bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="h-[180px] md:h-[200px] bg-gray-200 shimmer" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 bg-gray-200 rounded shimmer" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {transformedProducts.map((product, index) => (
              <div key={`${product.id}-${index}`} className="flex-none w-[180px] md:w-[200px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const TimeBox = ({ value }: { value: number }) => (
  <div className="bg-red-500 text-white rounded px-2 py-1 text-sm font-bold min-w-[28px] text-center">
    {value.toString().padStart(2, '0')}
  </div>
);

export default FlashSaleBanner;