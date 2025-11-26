import { useActiveFlashSales } from '@/hooks/useFlashSales';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

const FlashSaleBanner = () => {
  const { data: flashSales, isLoading } = useActiveFlashSales();
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const activeSale = flashSales?.[0]; // Show first active flash sale

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

  if (isLoading || !activeSale || !timeLeft) return null;

  return (
    <Card className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 border-0 overflow-hidden relative">
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
            <Link
              to="/search?flashSale=true"
              className="bg-white text-orange-600 px-6 py-2 rounded-full font-semibold hover:bg-white/90 transition-colors"
            >
              Shop Now
            </Link>
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