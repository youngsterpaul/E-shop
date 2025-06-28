
export const getOptimizedImageUrl = (
  url: string,
  width?: number,
  height?: number,
  format: 'webp' | 'jpg' | 'png' = 'webp',
  quality: number = 80
): string => {
  // Handle Unsplash URLs
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    const params = new URLSearchParams();
    
    params.set('auto', 'format');
    params.set('fit', 'crop');
    params.set('q', quality.toString());
    params.set('fm', format);
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  // For other CDNs, you can add similar logic
  return url;
};

export const generateSrcSet = (
  url: string,
  sizes: number[] = [400, 800, 1200],
  format: 'webp' | 'jpg' | 'png' = 'webp'
): string => {
  if (!url.includes('unsplash.com')) return '';
  
  return sizes
    .map(size => `${getOptimizedImageUrl(url, size, undefined, format)} ${size}w`)
    .join(', ');
};

export const preloadCriticalImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => {
      return new Promise<void>((resolve) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = getOptimizedImageUrl(url, 800);
        link.onload = () => resolve();
        link.onerror = () => resolve(); // Continue even if one fails
        document.head.appendChild(link);
      });
    })
  );
};

export const isImageCached = (url: string): boolean => {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.complete && img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  }) as any;
};
