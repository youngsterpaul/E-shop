
import { useEffect } from 'react';

const PerformanceMonitor = () => {
  useEffect(() => {
    // Monitor performance metrics
    if ('performance' in window) {
      window.addEventListener('load', () => {
        // Log performance metrics after page load
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          console.log('Performance Metrics:', {
            pageLoadTime: perfData.loadEventEnd - perfData.startTime,
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.startTime,
            firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
            firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime,
          });
        }, 1000);
      });
    }

    // Monitor for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('Long task detected:', entry.duration + 'ms');
            }
          });
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, []);

  return null;
};

export default PerformanceMonitor;
