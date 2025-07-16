
import { useState, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio?: 'square' | 'video' | 'auto';
  fallback?: string;
  sizes?: string;
  priority?: boolean;
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  aspectRatio = 'auto',
  fallback = '/placeholder.svg',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  className,
  ...props
}: OptimizedImageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Generate WebP src with fallback
  const getOptimizedSrc = (originalSrc: string) => {
    // Add null/undefined check
    if (!originalSrc || typeof originalSrc !== 'string') {
      return fallback;
    }
    
    if (originalSrc.includes('unsplash.com')) {
      // Optimize Unsplash images
      const baseUrl = originalSrc.split('?')[0];
      return `${baseUrl}?auto=format&fit=crop&w=${width || 800}&q=80&fm=webp`;
    }
    return originalSrc;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    // Add null/undefined check
    if (!originalSrc || typeof originalSrc !== 'string') {
      return undefined;
    }
    
    if (originalSrc.includes('unsplash.com')) {
      const baseUrl = originalSrc.split('?')[0];
      return [
        `${baseUrl}?auto=format&fit=crop&w=400&q=80&fm=webp 400w`,
        `${baseUrl}?auto=format&fit=crop&w=800&q=80&fm=webp 800w`,
        `${baseUrl}?auto=format&fit=crop&w=1200&q=80&fm=webp 1200w`,
      ].join(', ');
    }
    return undefined;
  };

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: ''
  };

  return (
    <div className={cn('relative overflow-hidden', aspectRatio !== 'auto' && aspectRatioClass[aspectRatio])}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      <img
        src={imageError ? fallback : getOptimizedSrc(src)}
        srcSet={!imageError ? generateSrcSet(src) : undefined}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        className={cn(
          'transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
