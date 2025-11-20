import { useEffect } from 'react';
import { logError, addBreadcrumb, trackApiCall } from '@/lib/sentry';

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: string;
  userAgent: string;
}

// Error throttling to prevent spam
const errorThrottle = new Map<string, number>();
const THROTTLE_DURATION = 30000; // 30 seconds

const shouldReportError = (message: string): boolean => {
  const now = Date.now();
  const lastReported = errorThrottle.get(message);
  
  if (!lastReported || now - lastReported > THROTTLE_DURATION) {
    errorThrottle.set(message, now);
    return true;
  }
  
  return false;
};

export const useErrorReporting = () => {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    const reportError = (error: ErrorReport) => {
      // Skip service worker errors and common development noise
      if (error.message.includes('ServiceWorker') || 
          error.message.includes('Cache.put') ||
          error.message.includes('ChunkLoadError') ||
          !shouldReportError(error.message)) {
        return;
      }

      // Report to Sentry
      const errorObj = new Error(error.message);
      if (error.stack) {
        errorObj.stack = error.stack;
      }
      
      logError(errorObj, {
        url: error.url,
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber,
        timestamp: error.timestamp,
        userAgent: error.userAgent,
      });
      
      console.error('Production Error Report:', error);
    };

    // Global error handler
    const handleError = (event: ErrorEvent) => {
      reportError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Skip service worker related rejections
      const reason = String(event.reason);
      if (reason.includes('ServiceWorker') || 
          reason.includes('Cache') ||
          reason.includes('fetch')) {
        return;
      }

      reportError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      });
    };

    // Resource loading error handler
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName) {
        reportError({
          message: `Resource loading error: ${target.tagName}`,
          url: (target as any).src || (target as any).href || window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return {
    reportCustomError: (message: string, details?: any) => {
      if (process.env.NODE_ENV === 'production') {
        const errorObj = new Error(`Custom Error: ${message}`);
        if (details?.stack) {
          errorObj.stack = details.stack;
        }
        
        logError(errorObj, {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          ...details,
        });
        
        console.error('Custom Error Report:', errorObj, details);
      }
    },
    logBreadcrumb: (message: string, category?: string, data?: Record<string, any>) => {
      addBreadcrumb(message, category, data);
    },
    trackApiCall: (url: string, method: string, statusCode?: number) => {
      trackApiCall(url, method, statusCode);
    }
  };
};