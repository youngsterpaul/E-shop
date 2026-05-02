import { useAllActiveFlashSaleProducts } from '@/hooks/useFlashSales';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import OptimizedImage from '@/components/OptimizedImage';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useProductFlashSaleFromContext } from '@/contexts/FlashSaleContext';

const FlashSaleBanner = () => {
  const isMobile = isMobileUserAgent();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const pageSize = isMobile ? 5 : 6;
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
    <section className={`bg-background rounded-xl ${isMobile ? 'mx-2 my-2 rounded-lg' : ''} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center bg-white justify-between ${isMobile ? 'px-2.5 py-2' : 'px-6 py-4 border-b border-border'}`}>
        {/* Left: Flash Sale title */}
        <div className="flex items-center gap-1.5">
          <div className={`${isMobile ? 'p-1' : 'p-2'} rounded-md backdrop-blur-sm`}>
            <Zap className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'} text-primary`} />
          </div>
          <h2 className={`${isMobile ? 'text-xs' : 'text-lg'} font-bold`}>
            Flash Sale
          </h2>
        </div>
        
        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-0.5">
          {!isMobile && (
            <>
              <Clock className="h-3 w-3 text-gray/80 mr-1" />
              <span className="text-xs text-gray/80 mr-2">Ends in</span>
            </>
          )}
          <TimeBox value={timeLeft.hours} isMobile={isMobile} />
          <span className={`text-gray/80 ${isMobile ? 'text-[10px]' : 'text-sm'} font-bold`}>:</span>
          <TimeBox value={timeLeft.minutes} isMobile={isMobile} />
          <span className={`text-gray/80 ${isMobile ? 'text-[10px]' : 'text-sm'} font-bold`}>:</span>
          <TimeBox value={timeLeft.seconds} isMobile={isMobile} />
        </div>
        
        {/* Right: More button */}
        <Link 
          to="/flash-sale"
          className={`flex items-center gap-0.5 ${isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-sm px-3 py-1.5'} bg-white/20 hover:bg-white/30 text-gray rounded-full font-medium transition-colors backdrop-blur-sm`}
        >
          More
          <ChevronRight className={`${isMobile ? 'h-2.5 w-2.5' : 'h-4 w-4'}`} />
        </Link>
      </div>

      {/* Products */}
      <div className={`bg-card ${isMobile ? 'px-2 py-2' : 'p-4'}`}>
        {isMobile ? (
          <div className="flex overflow-x-auto scrollbar-none gap-2 snap-x snap-mandatory">
            {transformedProducts.map((product, index) => (
              <FlashMobileTile key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        ) : (
          <div className={`grid ${isMobile ? 'grid-cols-2':'grid-cols-6'} gap-3`}>
            {transformedProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const FlashMobileTile = ({ product }: { product: any }) => {
  const { data: flashSale } = useProductFlashSaleFromContext(product.id);
  const flashPrice = flashSale
    ? flashSale.discount_type === 'percentage'
      ? product.price * (1 - flashSale.discount_value / 100)
      : product.price - flashSale.discount_value
    : null;
  const displayPrice = flashPrice ?? product.price;
  const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const fmt = (p: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(p);
  return (
    <Link
      to={`/product/${slug}/${product.id}`}
      className="flex-shrink-0 w-[24%] snap-start flex flex-col items-center"
    >
      <div className="w-full aspect-square rounded-md overflow-hidden bg-muted/30">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          width={120}
          height={120}
          aspectRatio="square"
          className="w-full h-full object-cover"
        />
      </div>
      <span className={`text-xs font-bold mt-1 ${flashPrice ? 'text-destructive' : 'text-foreground'}`}>
        {fmt(displayPrice)}
      </span>
      {flashPrice && (
        <span className="text-[9px] text-muted-foreground line-through leading-none">
          {fmt(product.price)}
        </span>
      )}
    </Link>
  );
};

const TimeBox = ({ value, isMobile }: { value: number; isMobile: boolean }) => (
  <span className={`bg-gray/25 text-gray backdrop-blur-sm rounded ${isMobile ? 'px-1 py-0.5 text-[10px]' : 'px-2 py-0.5 text-sm'} font-bold ${isMobile ? 'min-w-[18px]' : 'min-w-[28px]'} text-center inline-block`}>
    {value.toString().padStart(2, '0')}
  </span>
);

export default FlashSaleBanner;
