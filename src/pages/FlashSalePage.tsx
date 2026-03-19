import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFlashSaleProductsByTimeRange } from '@/hooks/useFlashSales';
import { Clock, Zap, AlertCircle, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { SEOHelmet } from '@/components/SEOHelmet';
import { Button } from '@/components/ui/button';
import { TIME_SLOTS, getCurrentSlotIndex, getSlotDates, type TimeSlot } from '@/utils/flashSaleSlots';

type SlotStatus = 'live' | 'upcoming' | 'ended';

const getSlotStatusForToday = (idx: number, currentIdx: number): SlotStatus => {
  if (idx < currentIdx) return 'ended';
  if (idx === currentIdx) return 'live';
  return 'upcoming';
};

const FlashSalePage = () => {
  const isMobile = isMobileUserAgent();
  const [activeSlotIdx, setActiveSlotIdx] = useState(getCurrentSlotIndex());
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [today, setToday] = useState(() => new Date());
  const currentSlotIdx = getCurrentSlotIndex();

  const selectedSlot = TIME_SLOTS[activeSlotIdx];
  const { start: slotStart, end: slotEnd } = useMemo(
    () => getSlotDates(today, selectedSlot),
    [today, selectedSlot]
  );

  const slotStatus = getSlotStatusForToday(activeSlotIdx, currentSlotIdx);

  const pageSize = isMobile ? 20 : 24;
  const { data: productsData, isLoading } = useFlashSaleProductsByTimeRange(slotStart, slotEnd, pageSize);

  // Countdown logic
  useEffect(() => {
    const calcTime = () => {
      const now = new Date();
      if (slotStatus === 'ended') {
        setTimeLeft(null);
        return;
      }

      const target = slotStatus === 'live' ? slotEnd : slotStart;
      const diff = target.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft(null);
      }
    };
    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [slotStatus, slotStart, slotEnd]);

  // Auto-update current slot and refresh date at midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newIdx = getCurrentSlotIndex();
      if (newIdx !== currentSlotIdx) {
        setActiveSlotIdx(newIdx);
      }
      // Refresh date if day changed
      const todayStr = today.toDateString();
      if (now.toDateString() !== todayStr) {
        setToday(now);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [currentSlotIdx, today]);

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

  const products = productsData?.products || [];
  const transformedProducts = useMemo(() => products.map(transformProductData), [products, transformProductData]);

  const gridConfig = isMobile
    ? { cols: 'grid-cols-2', gap: 'gap-2', padding: 'p-2' }
    : { cols: 'grid-cols-5', gap: 'gap-4', padding: 'p-6' };

  // Countdown label
  const countdownLabel = slotStatus === 'live' ? 'Ends in' : slotStatus === 'upcoming' ? 'Starts in' : '';

  return (
    <>
      <div className="min-h-screen bg-background">

      {/* Hero Header */}
      <div className="container max-w-[1200px] bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white">
        <div className={`mx-auto px-4 lg:px-6 ${isMobile ? 'py-3' : 'py-6'}`}>
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div>
                <h1 className={`${isMobile ? 'text-base' : 'text-2xl'} font-bold`}>Flash Sales</h1>
                <p className={`${isMobile ? 'text-[10px]' : 'text-sm'} text-white/80`}>
                  {productsData?.totalCount || 0} products • {selectedSlot.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {slotStatus === 'ended' ? (
                <Badge className="bg-white/20 text-white border-0">
                  <Clock className="h-3 w-3 mr-1" /> Ended
                </Badge>
              ) : timeLeft ? (
                <div className="flex items-center gap-1">
                  {!isMobile && (
                    <span className="text-white/80 text-xs mr-1">{countdownLabel}</span>
                  )}
                  <SlotCountdown timeLeft={timeLeft} isMobile={isMobile} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Time Slot Tabs */}
      <div className="max-w-[1200px] mx-auto bg-card border-b border-border sticky top-0 z-10">
        <div className={`flex ${isMobile ? 'overflow-x-auto scrollbar-none' : 'overflow-x-auto scrollbar-none'} gap-0`}>
          {TIME_SLOTS.map((slot, idx) => {
            const status = getSlotStatusForToday(idx, currentSlotIdx);
            const isActive = idx === activeSlotIdx;
            const isCurrent = idx === currentSlotIdx;
            return (
              <button
                key={idx}
                onClick={() => setActiveSlotIdx(idx)}
                className={`relative flex-shrink-0 ${isMobile ? 'px-2.5 py-2' : 'px-3 py-2.5'} text-center transition-all border-b-2 ${
                  isActive
                    ? status === 'live'
                      ? 'border-green-500 text-green-600 font-semibold bg-green-50 dark:bg-green-950/20'
                      : 'border-primary text-primary font-semibold bg-primary/5'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                } ${status === 'ended' && !isActive ? 'opacity-50' : ''}`}
              >
                <div className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} whitespace-nowrap`}>{slot.label}</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {status === 'live' && (
                    <Badge className={`${isMobile ? 'text-[7px] px-1 py-0' : 'text-[9px] px-1 py-0'} bg-green-500 border-0`}>
                      Live
                    </Badge>
                  )}
                  {status === 'upcoming' && isActive && (
                    <Badge variant="outline" className={`${isMobile ? 'text-[7px] px-1 py-0' : 'text-[9px] px-1 py-0'} border-blue-400 text-blue-500`}>
                      Soon
                    </Badge>
                  )}
                  {status === 'ended' && isActive && (
                    <Badge variant="secondary" className={`${isMobile ? 'text-[7px] px-1 py-0' : 'text-[9px] px-1 py-0'}`}>
                      Ended
                    </Badge>
                  )}
                </div>
                {isCurrent && !isActive && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* Products Section */}
      <div className={`max-w-[1200px] mx-auto`}>
        {isLoading ? (
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex flex-col bg-card rounded-xl shadow-sm overflow-hidden border border-border/50">
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
            <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-foreground mb-2`}>
              {slotStatus === 'ended' ? 'Flash Sale Ended' : slotStatus === 'upcoming' ? 'Coming Soon' : 'No Products Available'}
            </h3>
            {slotStatus !== 'live' && (
              <Button variant="outline" onClick={() => setActiveSlotIdx(currentSlotIdx)}>
                View Current Sale
              </Button>
            )}
          </div>
        ) : (
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap} bg-card rounded-xl shadow-sm p-4`}>
            {transformedProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} flashSaleOverride={slotStatus === 'live' ? undefined : null} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
};

const SlotCountdown = ({ timeLeft, isMobile }: { timeLeft: { hours: number; minutes: number; seconds: number }; isMobile: boolean }) => (
  <div className="flex items-center gap-1">
    <TimeBox value={timeLeft.hours} isMobile={isMobile} />
    <span className="text-white/60 text-xs font-bold">:</span>
    <TimeBox value={timeLeft.minutes} isMobile={isMobile} />
    <span className="text-white/60 text-xs font-bold">:</span>
    <TimeBox value={timeLeft.seconds} isMobile={isMobile} />
  </div>
);

const TimeBox = ({ value, isMobile }: { value: number; isMobile: boolean }) => (
  <div className={`flex items-center justify-center bg-white/25 backdrop-blur-sm ${isMobile ? 'px-1.5 py-0.5 rounded min-w-[24px]' : 'px-2.5 py-1 rounded-md min-w-[36px]'}`}>
    <span className={`${isMobile ? 'text-xs' : 'text-lg'} font-bold text-white leading-tight`}>
      {value.toString().padStart(2, '0')}
    </span>
  </div>
);

export default FlashSalePage;
