import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not configured. Error tracking is disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    enabled: import.meta.env.MODE === 'production',
    
    // Performance Monitoring
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance tracking
    tracesSampleRate: 1.0, // Capture 100% of transactions in production
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension',
      'moz-extension',
      // Network errors that are expected
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Service Worker errors
      'ServiceWorker',
      'Cache.put',
      'ChunkLoadError',
      // Browser quirks
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],

    beforeSend(event, hint) {
      // Filter out errors from browser extensions
      if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
        frame => frame.filename?.includes('chrome-extension://') || 
                 frame.filename?.includes('moz-extension://')
      )) {
        return null;
      }

      // Add user context if available
      const userEmail = localStorage.getItem('user_email');
      if (userEmail) {
        event.user = {
          ...event.user,
          email: userEmail,
        };
      }

      return event;
    },
  });
};

// Custom error logging functions
export const logError = (error: Error, context?: Record<string, any>) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error('Error:', error, context);
  }
};

export const logMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) => {
  if (import.meta.env.MODE === 'production') {
    Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  } else {
    console.log(`[${level}]`, message, context);
  }
};

export const setUserContext = (userId: string, email?: string, username?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    username,
  });
};

export const clearUserContext = () => {
  Sentry.setUser(null);
};

export const addBreadcrumb = (message: string, category?: string, data?: Record<string, any>) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Track API calls
export const trackApiCall = (url: string, method: string, statusCode?: number) => {
  addBreadcrumb(`API Call: ${method} ${url}`, 'api', {
    url,
    method,
    statusCode,
  });

  if (statusCode && statusCode >= 400) {
    logMessage(
      `API Error: ${method} ${url} - ${statusCode}`,
      statusCode >= 500 ? 'error' : 'warning',
      { url, method, statusCode }
    );
  }
};

// Track performance
export const trackPerformance = (name: string, duration: number, data?: Record<string, any>) => {
  addBreadcrumb(`Performance: ${name} - ${duration}ms`, 'performance', {
    duration,
    ...data,
  });
};

export { Sentry };
