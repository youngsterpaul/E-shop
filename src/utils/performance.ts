
import React from 'react';

// Performance utilities for optimization
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T => {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

export const lazyLoad = (importFunc: () => Promise<any>) => {
  return React.lazy(importFunc);
};

// Image optimization utility with better CDN support
export const optimizeImageUrl = (url: string, width?: number, height?: number, quality = 80): string => {
  if (!url) return url;
  
  // If it's already optimized or is a placeholder, return as-is
  if (url.includes('placeholder') || url.includes('w_') || url.includes('h_')) {
    return url;
  }
  
  // Basic URL optimization for common CDNs
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', 'webp'); // Force WebP format for better compression
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
};

// Batch multiple API requests into a single call
export const batchRequests = async <T>(
  requests: (() => Promise<T>)[]
): Promise<T[]> => {
  return Promise.all(requests.map(req => req()));
};

// Resource preloading utility
export const preloadResource = (href: string, as: string, type?: string) => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  if (type) link.type = type;
  document.head.appendChild(link);
};

// Defer loading of non-critical resources
export const deferLoad = (callback: () => void, delay = 0) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => callback(), { timeout: delay });
  } else {
    setTimeout(callback, delay);
  }
};
