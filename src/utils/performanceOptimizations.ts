// Performance optimization utilities for production

// Preload critical resources
export const preloadCriticalResources = () => {
  // Avoid duplicate preloads
  if (document.querySelector('link[data-preload="critical"]')) {
    return;
  }

  // Preload and load fonts immediately
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontPreload.as = 'style';
  fontPreload.crossOrigin = 'anonymous';
  fontPreload.dataset.preload = 'critical';
  
  // Load the font stylesheet immediately after preload
  fontPreload.onload = () => {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = fontPreload.href;
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  };
  
  document.head.appendChild(fontPreload);

  // Only preload hero images that are actually used
  const hasHeroSection = document.querySelector('[data-hero]') || 
                        document.querySelector('.hero') ||
                        window.location.pathname === '/';
                        
  if (hasHeroSection) {
    const heroImageLink = document.createElement('link');
    heroImageLink.rel = 'preload';
    heroImageLink.href = '/hero1.webp';
    heroImageLink.as = 'image';
    heroImageLink.dataset.preload = 'critical';
    document.head.appendChild(heroImageLink);
  }
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
  // Enable service worker for caching with better error handling
  registerServiceWorker: async () => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none' // Always check for updates
        });
        console.log('Service Worker registered successfully');
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  },
  
  // Preconnect to external domains (avoid duplicates)
  addPreconnects: () => {
    if (document.querySelector('link[data-preconnect="added"]')) {
      return;
    }

    const domains = [
      'https://sgpjnbdrmwrupeqhjqpj.supabase.co',
      'https://fonts.gstatic.com'
    ];
    
    domains.forEach(domain => {
      if (!document.querySelector(`link[href="${domain}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        link.dataset.preconnect = 'added';
        document.head.appendChild(link);
      }
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
      //console.log('Memory usage:', {
        //used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        //total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        //limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
      //});
    }
  }
};