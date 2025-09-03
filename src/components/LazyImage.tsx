import { useState, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  fallback?: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  responsive?: boolean; // NEW
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
  responsive = false, // NEW
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

  // Example: derive versions (hero1-small.webp, hero1-medium.webp, hero1-large.webp)
  const baseName = src.replace(/\.(webp|jpg|png|jpeg)$/i, '');
  const extension = src.split('.').pop();

  return (
    <div className={cn('relative overflow-hidden', aspectRatioClass[aspectRatio])}>
      {isLoading && (
        <Skeleton className="absolute inset-0 w-full h-full" />
      )}
      <img
        src={hasError ? fallback : src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        {...(responsive && !hasError
          ? {
              srcSet: `
                ${baseName}-small.${extension} 640w,
                ${baseName}-medium.${extension} 1280w,
                ${baseName}-large.${extension} 1920w
              `,
              sizes: '(max-width: 768px) 100vw, 100vh',
            }
          : {}
        )}
        {...props}
      />
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
