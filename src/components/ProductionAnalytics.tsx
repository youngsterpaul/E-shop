import { useEffect } from 'react';

interface AnalyticsEvent {
  event: string;
  parameters?: Record<string, any>;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const ProductionAnalytics = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // Initialize analytics tracking
    const initAnalytics = () => {
      // Track page views
      const trackPageView = () => {
        if (window.gtag) {
          window.gtag('event', 'page_view', {
            page_title: document.title,
            page_location: window.location.href,
          });
        }
      };

      // Track user engagement
      const trackEngagement = () => {
        let engagementTimer = 0;
        const interval = setInterval(() => {
          engagementTimer += 1;
          if (engagementTimer >= 30) { // 30 seconds
            if (window.gtag) {
              window.gtag('event', 'user_engagement', {
                engagement_time_msec: engagementTimer * 1000
              });
            }
            clearInterval(interval);
          }
        }, 1000);

        // Clear timer on page unload
        window.addEventListener('beforeunload', () => {
          clearInterval(interval);
        });
      };

      // Track scroll depth
      const trackScrollDepth = () => {
        let maxScroll = 0;
        const handleScroll = () => {
          const scrollPercent = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
          );
          
          if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
            maxScroll = scrollPercent;
            if (window.gtag) {
              window.gtag('event', 'scroll', {
                percent_scrolled: scrollPercent
              });
            }
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
      };

      // Track Core Web Vitals
      const trackWebVitals = () => {
        // FCP
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              if (window.gtag) {
                window.gtag('event', 'web_vitals', {
                  metric_name: 'FCP',
                  metric_value: Math.round(entry.startTime),
                  metric_id: 'v1-fcp'
                });
              }
            }
          });
        });

        if ('PerformanceObserver' in window) {
          observer.observe({ entryTypes: ['paint'] });
        }
      };

      trackPageView();
      trackEngagement();
      trackScrollDepth();
      trackWebVitals();
    };

    initAnalytics();
  }, []);

  return null;
};