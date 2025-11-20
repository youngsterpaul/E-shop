import { useCallback } from 'react';
import { trackApiCall, logError, addBreadcrumb } from '@/lib/sentry';

/**
 * Hook to track API calls with Sentry
 * Automatically logs API errors and tracks performance
 */
export const useSentryApi = () => {
  const trackRequest = useCallback(
    async <T,>(
      requestFn: () => Promise<T>,
      options: {
        endpoint: string;
        method: string;
        description?: string;
      }
    ): Promise<T> => {
      const startTime = performance.now();
      
      addBreadcrumb(
        `API Request: ${options.method} ${options.endpoint}`,
        'api',
        { description: options.description }
      );

      try {
        const result = await requestFn();
        const duration = performance.now() - startTime;
        
        trackApiCall(options.endpoint, options.method, 200);
        
        addBreadcrumb(
          `API Success: ${options.method} ${options.endpoint} (${duration.toFixed(0)}ms)`,
          'api',
          { duration, success: true }
        );

        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        const statusCode = (error as any)?.status || 500;
        
        trackApiCall(options.endpoint, options.method, statusCode);
        
        logError(error as Error, {
          endpoint: options.endpoint,
          method: options.method,
          statusCode,
          duration,
          description: options.description,
        });

        throw error;
      }
    },
    []
  );

  return { trackRequest };
};
