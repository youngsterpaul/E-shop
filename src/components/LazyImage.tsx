import { useState, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'hero' | 'hero-mobile' | 'fill';
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

  const aspectRatioClass: Record<string, string> = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    hero: 'aspect-[4/1]',
    'hero-mobile': 'aspect-[2.68/1]',
    fill: 'w-full h-full'
  };

  const imgWidth = width || 800;
  const imgHeight = height || 600;

  // For fill mode, render without aspect ratio wrapper
  if (aspectRatio === 'fill') {
    return (
      <>
        {isLoading && <Skeleton className="absolute inset-0 w-full h-full" aria-hidden="true" />}
        <img
          src={hasError ? fallback : src}
          alt={alt}
          width={imgWidth}
          height={imgHeight}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          {...props}
        />
      </>
    );
  }

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
