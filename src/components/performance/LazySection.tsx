
import { ReactNode, memo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
  threshold?: number;
}

const LazySection = memo(({ 
  children, 
  fallback,
  className = '',
  threshold = 0.1 
}: LazySectionProps) => {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ 
    threshold, 
    triggerOnce: true 
  });

  const defaultFallback = (
    <div className={`py-12 ${className}`}>
      <div className="container mx-auto px-4">
        <Skeleton className="h-8 w-64 mx-auto mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
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

LazySection.displayName = 'LazySection';

export default LazySection;
