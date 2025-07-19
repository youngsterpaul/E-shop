// Performance optimization utilities for production

// Preload critical resources
export const preloadCriticalResources = () => {
  // Preload fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
  
  // Preload hero images
  const heroImageLink = document.createElement('link');
  heroImageLink.rel = 'preload';
  heroImageLink.href = '/placeholder.svg';
  heroImageLink.as = 'image';
  document.head.appendChild(heroImageLink);
};

// Database query optimization
export const optimizeSupabaseQueries = {
  // Use select specific fields to reduce data transfer
  productListFields: `
    product_id,
    name,
    price,
    image_urls,
    categories,
    rating,
    stock,
    featured
  `,
  
  productDetailFields: `
    product_id,
    name,
    price,
    description,
    image_urls,
    categories,
    rating,
    stock,
    specification,
    features,
    brand_id
  `,
  
  orderFields: `
    order_id,
    status,
    amount,
    created_at,
    updated_at
  `
};

// Image optimization
export const optimizeImageLoading = () => {
  // Lazy load images using Intersection Observer
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  // Observe all lazy images
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};

// Bundle size optimization
export const loadComponentOnDemand = async (componentName: string) => {
  switch (componentName) {
    case 'ProductDetailsPage':
      return import('../pages/ProductDetailsPage');
    case 'CartPage':
      return import('../pages/CartPage');
    default:
      throw new Error(`Component ${componentName} not found`);
  }
};

// Cache management
export const cacheManager = {
  set: (key: string, data: any, ttl: number = 5 * 60 * 1000) => {
    const item = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  },
  
  get: (key: string) => {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (Date.now() - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return parsed.data;
  },
  
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};

// Network optimization
export const networkOptimizations = {
  // Enable service worker for caching
  registerServiceWorker: async () => {
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },
  
  // Preconnect to external domains
  addPreconnects: () => {
    const domains = [
      'https://sgpjnbdrmwrupeqhjqpj.supabase.co',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];
    
    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
};

// Memory optimization
export const memoryOptimizations = {
  // Clean up old cache entries
  cleanupCache: () => {
    const maxCacheSize = 50; // Maximum number of cache entries
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    
    if (keys.length > maxCacheSize) {
      const sortedKeys = keys.sort((a, b) => {
        const aItem = JSON.parse(localStorage.getItem(a) || '{}');
        const bItem = JSON.parse(localStorage.getItem(b) || '{}');
        return aItem.timestamp - bItem.timestamp;
      });
      
      // Remove oldest entries
      sortedKeys.slice(0, keys.length - maxCacheSize).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  },
  
  // Monitor memory usage
  monitorMemory: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      });
    }
  }
};