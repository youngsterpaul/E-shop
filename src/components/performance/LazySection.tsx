import { ReactNode, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';

interface GemFashionStyleProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  threshold?: number;
}

const GemFashionStyle = memo(({ 
  children, 
  fallback,
  className = '',
  threshold = 0.01 // High-performance preload for seamless editorial experience
}: GemFashionStyleProps) => {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ 
    threshold, 
    triggerOnce: true,
    rootMargin: '400px' // Preload 400px before user scrolls to maintain premium feel
  });

  // Premium Fashion Editorial Layout Fallback (Sophisticated minimalist aesthetic)
  const defaultFallback = (
    <div className={`py-16 bg-[#FAFAFA] dark:bg-[#121212] transition-colors duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Editorial Subtitle & Main Category Title */}
        <div className="flex flex-col items-center mb-16 text-center space-y-3">
          <Skeleton className="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 tracking-widest uppercase rounded-none" />
          <Skeleton className="h-10 w-80 bg-neutral-300 dark:bg-neutral-700 font-serif rounded-none" />
          <div className="w-12 h-[1px] bg-neutral-400 dark:bg-neutral-600 mt-2" />
        </div>

        {/* Dynamic Fashion Lookbook / Look Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-4 group">
              {/* Image Canvas Placeholder with high-end apparel aspect ratio (3:4) */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <Skeleton className="h-full w-full bg-neutral-200 dark:bg-neutral-800 rounded-none transition-transform duration-500 hover:scale-105" />
              </div>
              
              {/* Metadata / Price Tags Placeholders */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-2/3 bg-neutral-300 dark:bg-neutral-700 rounded-none" />
                  <Skeleton className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
                </div>
                <Skeleton className="h-3 w-1/3 bg-neutral-200 dark:bg-neutral-800 rounded-none" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );

  return (
    <div ref={ref} className={className}>
      {isIntersecting ? children : (fallback || defaultFallback)}
    </div>
  );
});

GemFashionStyle.displayName = 'GemFashionStyle';

export default GemFashionStyle;