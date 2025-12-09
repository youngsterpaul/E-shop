import { useState, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean; // true = eager + high fetch priority
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'hero' | 'hero-mobile';
  width?: number;
  height?: number;
}

const LazyImage = memo(({
  src,
  alt,
  fallback = '/placeholder.svg',
  priority = false,
  aspectRatio = 'square',
  width,
  height,
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
    landscape: 'aspect-[4/3]',
    hero: 'aspect-[4/1]',
    'hero-mobile': 'aspect-[2.68/1]'
  };

  // Default dimensions based on aspect ratio to prevent CLS
  const defaultDimensions = {
    square: { width: 300, height: 300 },
    video: { width: 640, height: 360 },
    portrait: { width: 300, height: 400 },
    landscape: { width: 400, height: 300 },
    hero: { width: 1920, height: 480 },
    'hero-mobile': { width: 750, height: 280 }
  };

  const imgWidth = width || defaultDimensions[aspectRatio]?.width;
  const imgHeight = height || defaultDimensions[aspectRatio]?.height;

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass[aspectRatio])}>
      {isLoading && <Skeleton className="absolute inset-0 w-full h-full" aria-hidden="true" />}
      
      <img
        src={hasError ? fallback : src}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-expect-error fetchPriority is a valid attribute but not in React's types yet
        fetchpriority={priority ? 'high' : 'auto'}
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
