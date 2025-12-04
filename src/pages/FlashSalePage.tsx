import { useState, useEffect } from 'react';
import { useActiveFlashSales, useAllActiveFlashSaleProducts } from '@/hooks/useFlashSales';
import { Clock, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';

const FlashSalePage = () => {
  const isMobile = isMobileUserAgent();
  const { data: flashSales, isLoading: salesLoading } = useActiveFlashSales();

  const pageSize = isMobile ? 20 : 24;
  const gridConfig = isMobile
    ? { cols: "grid-cols-2", gap: "gap-2", padding: "p-2" }
    : { cols: "grid-cols-6", gap: "gap-4", padding: "p-6" };

  const { data: productsData, isLoading: productsLoading } = useAllActiveFlashSaleProducts(pageSize);

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

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
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [productsData?.earliestEndDate]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flash sales...</p>
        </div>
      </div>
    );
  }

  if (!flashSales || flashSales.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12">
        <SEOHelmet 
          title="Flash Sales - SmartKenya"
          description="Check out our amazing flash sales and limited-time offers"
        />
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Zap className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">No Active Flash Sales</h1>
            <p className="text-muted-foreground mb-8">
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
    <div className="min-h-screen bg-background">
      <SEOHelmet 
        title="Flash Sales - SmartKenya"
        description="Don't miss out on our limited-time flash sale offers. Huge discounts on electronics, gadgets and more!"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className={`container mx-auto px-4 lg:px-8 ${isMobile ? 'py-6' : 'py-12'}`}>
          <div className={`flex flex-col ${isMobile ? 'gap-4' : 'md:flex-row gap-6'} items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Zap className={`${isMobile ? 'h-6 w-6' : 'h-10 w-10'}`} />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-4xl'} font-bold mb-2`}>
                  Flash Sales
                </h1>
                <p className={`text-white/90 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                  {flashSales?.length || 0} active sales • {productsData?.totalCount || 0} products
                </p>
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
            {flashSales && flashSales.length > 0 && (
              <Badge className={`bg-white/20 hover:bg-white/30 text-white border-white/30 ${isMobile ? 'text-xs px-3 py-1' : 'text-base px-4 py-2'}`}>
                {flashSales.length} Active Sale{flashSales.length > 1 ? 's' : ''}
              </Badge>
            )}
            {productsData?.totalCount && (
              <Badge className={`bg-white/20 hover:bg-white/30 text-white border-white/30 ${isMobile ? 'text-xs px-3 py-1' : 'text-base px-4 py-2'}`}>
                {productsData.totalCount} Products on Sale
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className={`container mx-auto ${gridConfig.padding}`}>
        {productsLoading ? (
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
            {Array.from({ length: pageSize }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col bg-card rounded-xl shadow-sm overflow-hidden border border-border/50"
              >
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className={`${isMobile ? 'h-12 w-12' : 'h-16 w-16'} text-muted-foreground/50 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-foreground mb-2`}>No Products Available</h3>
            <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground`}>
              Products will be added to this flash sale soon. Check back later!
            </p>
          </div>
        ) : (
          <>
            {!isMobile && (
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Flash Sale Items</h2>
                </div>
                <p className="text-muted-foreground">
                  Showing {products.length} {productsData?.totalCount && `of ${productsData.totalCount}`} products
                </p>
              </div>
            )}

            <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-card rounded-xl shadow-sm p-4`}>
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
  <div className={`flex flex-col items-center bg-white/20 backdrop-blur-sm rounded-lg ${isMobile ? 'px-3 py-2 min-w-[50px]' : 'px-4 py-3 min-w-[70px]'}`}>
    <span className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold text-white`}>
      {value.toString().padStart(2, '0')}
    </span>
    <span className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-white/80`}>{label}</span>
  </div>
);

export default FlashSalePage;
