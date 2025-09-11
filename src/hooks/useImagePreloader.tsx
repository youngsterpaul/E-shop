
import { useEffect, useState } from 'react';

interface UseImagePreloaderProps {
  images: string[];
  priority?: boolean;
}

export const useImagePreloader = ({ images, priority = false }: UseImagePreloaderProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (images.length === 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const loadedSet = new Set<string>();

    const preloadImage = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          if (isMounted) {
            loadedSet.add(src);
            setLoadedImages(new Set(loadedSet));
          }
          resolve();
        };
        
        img.onerror = () => {
          console.warn(`Failed to preload image: ${src}`);
          resolve(); // Continue with other images
        };
        
        // Optimize image URL if it's from Unsplash
        if (src.includes('unsplash.com')) {
          img.src = `${src.split('?')[0]}?auto=format&fit=crop&w=400&q=80&fm=webp`;
        } else {
          img.src = src;
        }
      });
    };

    const loadImages = async () => {
      try {
        if (priority) {
          // Load images sequentially for priority
          for (const image of images) {
            await preloadImage(image);
          }
        } else {
          // Load images in parallel for non-priority
          await Promise.allSettled(images.map(preloadImage));
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to preload images');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      isMounted = false;
    };
  }, [images, priority]);

  return {
    loadedImages,
    isLoading,
    error,
    isImageLoaded: (src: string) => loadedImages.has(src)
  };
};
