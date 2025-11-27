import { useState, useEffect } from 'react';
import { useActiveFlashSales, useFlashSaleProductsWithDetails } from '@/hooks/useFlashSales';
import { Clock, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FlashSalePage = () => {
  const isMobile = isMobileUserAgent();
  const { data: flashSales, isLoading: salesLoading } = useActiveFlashSales();
  const [selectedSaleId, setSelectedSaleId] = useState<string | undefined>();
  
  // Use the first active sale as default
  const activeSale = flashSales?.[0];
  const saleId = selectedSaleId || activeSale?.id;

  // Grid layout configuration - match EnhancedFeaturedProducts
  const pageSize = isMobile ? 20 : 24;
  const gridConfig = isMobile
    ? { cols: "grid-cols-2", gap: "gap-2", padding: "p-2" }
    : { cols: "grid-cols-6", gap: "gap-y-1", padding: "p-8" };

  const { data: productsData, isLoading: productsLoading } = useFlashSaleProductsWithDetails(
    saleId,
    pageSize
  );

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  // Calculate time left for selected sale
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
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [activeSale]);

  const transformProductData = (product: any) => ({
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
  });

  const products = productsData?.products || [];
  const transformedProducts = products.map(transformProductData);

  if (salesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flash sales...</p>
        </div>
      </div>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <SEOHelmet 
          title="Flash Sales - SmartKenya"
          description="Check out our amazing flash sales and limited-time offers"
        />
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-yellow-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Zap className="h-10 w-10 text-yellow-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Active Flash Sales</h1>
            <p className="text-gray-600 mb-8">
              There are currently no active flash sales. Check back soon for amazing deals!
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isMobile ? 'bg-white' : 'bg-gray-50'}`}>
      <SEOHelmet 
        title={`${activeSale?.title || 'Flash Sales'} - SmartKenya`}
        description="Don't miss out on our limited-time flash sale offers. Huge discounts on electronics, gadgets and more!"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className={`${isMobile ? 'px-4 py-6' : 'container mx-auto px-4 py-12'}`}>
          <div className={`flex flex-col ${isMobile ? 'gap-4' : 'md:flex-row'} items-center justify-between ${isMobile ? '' : 'gap-6'}`}>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Zap className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'}`} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-2`}>
                  {activeSale?.title || 'Flash Sales'}
                </h1>
                {activeSale?.description && (
                  <p className={`text-white/90 ${isMobile ? 'text-sm' : 'text-lg'}`}>{activeSale.description}</p>
                )}
              </div>
            </div>

            {timeLeft && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
                  <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium`}>Ends in:</span>
                </div>
                <div className="flex gap-2">
                  <TimeBox value={timeLeft.hours} label="Hours" isMobile={isMobile} />
                  <TimeBox value={timeLeft.minutes} label="Mins" isMobile={isMobile} />
                  <TimeBox value={timeLeft.seconds} label="Secs" isMobile={isMobile} />
                </div>
              </div>
            )}
          </div>

          <div className={`${isMobile ? 'mt-4' : 'mt-6'} flex flex-wrap items-center gap-3`}>
            {activeSale && (
              <Badge className={`bg-white/20 hover:bg-white/30 text-white ${isMobile ? 'text-xs px-3 py-1' : 'text-base px-4 py-2'}`}>
                {activeSale.discount_type === 'percentage'
                  ? `${activeSale.discount_value}% OFF`
                  : `KES ${activeSale.discount_value} OFF`}
              </Badge>
            )}
            {productsData?.totalCount && (
              <Badge className={`bg-white/20 hover:bg-white/30 text-white ${isMobile ? 'text-xs px-3 py-1' : 'text-base px-4 py-2'}`}>
                {productsData.totalCount} Products on Sale
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Multiple Flash Sales Tabs */}
      {flashSales.length > 1 && (
        <div className="bg-white border-b">
          <div className={`${isMobile ? 'px-4' : 'container mx-auto px-4'} py-4`}>
            <Tabs value={saleId} onValueChange={setSelectedSaleId} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {flashSales.map((sale) => (
                  <TabsTrigger key={sale.id} value={sale.id} className={`flex-shrink-0 ${isMobile ? 'text-xs' : ''}`}>
                    <Zap className="h-4 w-4 mr-2" />
                    {sale.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className={`${isMobile ? '' : 'container mx-auto'} ${gridConfig.padding}`}>
        {productsLoading ? (
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
            {Array.from({ length: pageSize }).map((_, i) => (
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
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-gray-400 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 mb-2`}>No Products Available</h3>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
              Products will be added to this flash sale soon. Check back later!
            </p>
          </div>
        ) : (
          <>
            {!isMobile && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Flash Sale Items</h2>
                </div>
                <p className="text-gray-600">
                  Showing {products.length} {productsData?.totalCount && `of ${productsData.totalCount}`} products
                </p>
              </div>
            )}

            <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-white shadow-sm`}>
              {transformedProducts.map((product, index) => (
                <ProductCard key={`${product.id}-${index}`} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const TimeBox = ({ value, label, isMobile }: { value: number; label: string; isMobile: boolean }) => (
  <div className={`flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1.5 min-w-[50px]' : 'px-4 py-2 min-w-[70px]'}`}>
    <span className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-white`}>
      {value.toString().padStart(2, '0')}
    </span>
    <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-white/80`}>{label}</span>
  </div>
);

export default FlashSalePage;
