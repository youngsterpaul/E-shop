import { useState, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean; // true = eager + high fetch priority
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

const LazyImage = memo(({
  src,
  alt,
  fallback = '/placeholder.svg',
  priority = false,
  aspectRatio = 'square',
  className,
  onLoad,
  onError,
  ...props
}: LazyImageProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass[aspectRatio])}>
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
      
      <img
        src={hasError ? fallback : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'} // ✅ key addition
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...props}
      />
    </div>
  );
});

LazyImage.displayName = 'LazyImage';
export default LazyImage;
