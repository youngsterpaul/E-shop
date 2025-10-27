<<<<<<< HEAD
import { useEffect } from 'react';
import { cacheManager, memoryOptimizations } from '@/utils/performanceOptimizations';

export const useProductionOptimizations = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Performance monitoring
      const performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Log performance metrics
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstPaint: navEntry.responseEnd - navEntry.requestStart
            });
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });

      try {
        performanceObserver.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance observer not supported');
      }

      // Memory cleanup interval
      const memoryCleanup = setInterval(() => {
        memoryOptimizations.cleanupCache();
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }, 300000); // Every 5 minutes

      // Cleanup on visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          memoryOptimizations.cleanupCache();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(memoryCleanup);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        performanceObserver.disconnect();
      };
    }
  }, []);

  return {
    cacheManager,
    memoryOptimizations
  };
=======
import { useEffect } from 'react';
import { cacheManager, memoryOptimizations } from '@/utils/performanceOptimizations';

export const useProductionOptimizations = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Performance monitoring
      const performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Log performance metrics
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Navigation timing:', {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstPaint: navEntry.responseEnd - navEntry.requestStart
            });
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });

      try {
        performanceObserver.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
      } catch (e) {
        console.warn('Performance observer not supported');
      }

      // Memory cleanup interval
      const memoryCleanup = setInterval(() => {
        memoryOptimizations.cleanupCache();
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }, 300000); // Every 5 minutes

      // Cleanup on visibility change
      const handleVisibilityChange = () => {
        if (document.hidden) {
          memoryOptimizations.cleanupCache();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(memoryCleanup);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        performanceObserver.disconnect();
      };
    }
  }, []);

  return {
    cacheManager,
    memoryOptimizations
  };
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
};