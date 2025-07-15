import { useEffect } from 'react';
import { 
  preloadCriticalResources, 
  optimizeImageLoading,
  networkOptimizations,
  memoryOptimizations
} from '@/utils/performanceOptimizations';

export const ProductionOptimizer = () => {
  useEffect(() => {
    // Only run optimizations in production
    if (process.env.NODE_ENV === 'production') {
      // Preload critical resources
      preloadCriticalResources();
      
      // Add preconnects to external domains
      networkOptimizations.addPreconnects();
      
      // Register service worker
      networkOptimizations.registerServiceWorker();
      
      // Optimize image loading
      const optimizeImages = () => {
        optimizeImageLoading();
      };
      
      // Run after DOM is ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', optimizeImages);
      } else {
        optimizeImages();
      }
      
      // Memory management
      memoryOptimizations.cleanupCache();
      
      // Monitor performance
      const performanceTimer = setInterval(() => {
        memoryOptimizations.monitorMemory();
        memoryOptimizations.cleanupCache();
      }, 60000); // Every minute
      
      return () => {
        clearInterval(performanceTimer);
        document.removeEventListener('DOMContentLoaded', optimizeImages);
      };
    }
  }, []);

  return null;
};