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

  const { data: productsData, isLoading: productsLoading } = useFlashSaleProductsWithDetails(
    saleId,
    50
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

  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-6";

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
    <div className="min-h-screen bg-gray-50">
      <SEOHelmet 
        title={`${activeSale?.title || 'Flash Sales'} - SmartKenya`}
        description="Don't miss out on our limited-time flash sale offers. Huge discounts on electronics, gadgets and more!"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Zap className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {activeSale?.title || 'Flash Sales'}
                </h1>
                {activeSale?.description && (
                  <p className="text-white/90 text-lg">{activeSale.description}</p>
                )}
              </div>
            </div>

            {timeLeft && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-6 w-6" />
                  <span className="text-lg font-medium">Ends in:</span>
                </div>
                <div className="flex gap-2">
                  <TimeBox value={timeLeft.hours} label="Hours" />
                  <TimeBox value={timeLeft.minutes} label="Mins" />
                  <TimeBox value={timeLeft.seconds} label="Secs" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {activeSale && (
              <Badge className="bg-white/20 hover:bg-white/30 text-white text-base px-4 py-2">
                {activeSale.discount_type === 'percentage'
                  ? `${activeSale.discount_value}% OFF`
                  : `KES ${activeSale.discount_value} OFF`}
              </Badge>
            )}
            {productsData?.totalCount && (
              <Badge className="bg-white/20 hover:bg-white/30 text-white text-base px-4 py-2">
                {productsData.totalCount} Products on Sale
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Multiple Flash Sales Tabs */}
      {flashSales.length > 1 && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <Tabs value={saleId} onValueChange={setSelectedSaleId} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {flashSales.map((sale) => (
                  <TabsTrigger key={sale.id} value={sale.id} className="flex-shrink-0">
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
      <div className="container mx-auto px-4 py-8">
        {productsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Available</h3>
            <p className="text-gray-600">
              Products will be added to this flash sale soon. Check back later!
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Flash Sale Items</h2>
              </div>
              <p className="text-gray-600">
                Showing {products.length} {productsData?.totalCount && `of ${productsData.totalCount}`} products
              </p>
            </div>

            <div className={`grid ${gridCols} gap-4`}>
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

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 min-w-[70px]">
    <span className="text-3xl font-bold text-white">
      {value.toString().padStart(2, '0')}
    </span>
    <span className="text-sm text-white/80">{label}</span>
  </div>
);

export default FlashSalePage;
