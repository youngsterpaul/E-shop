import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import { initSentry } from './lib/sentry';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/contexts/CartContext';
import { SelectiveCartProvider } from '@/contexts/SelectiveCartContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { FlashSaleProvider } from '@/contexts/FlashSaleContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { OfflineCacheManager } from '@/components/OfflineCacheManager';
import { AccessibilitySkipLink } from '@/components/AccessibilitySkipLink';
import { ProductionAnalytics } from '@/components/ProductionAnalytics';
import { ProductionOptimizer } from '@/components/ProductionOptimizer';
import { VersionManager } from '@/components/VersionManager';
import SecurityHeaders from '@/components/SecurityHeaders';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { EnhancedSEO } from '@/components/EnhancedSEO';
import { ABTestProvider } from '@/components/ABTestProvider';
import App from './App.tsx';
import './index.css';
import { ScrollToTop } from '@/components/ScrollToTop';

// Initialize Sentry before anything else
initSentry();


const AppWithAnalytics = () => {
  useErrorReporting();
  return (
    <>
      <SecurityHeaders />
      <CriticalCSS />
      <PerformanceMonitor />
      <EnhancedSEO />
      <ScrollToTop />
      <ProductionOptimizer />
      <VersionManager />
      <App />
      <ProductionAnalytics />
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      gcTime: 30 * 60 * 1000, // 30 minutes in memory
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="smartkenya-theme">
        <HelmetProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <ABTestProvider>
                  <NotificationProvider>
                    <FlashSaleProvider>
                      <CartProvider>
                        <SelectiveCartProvider>
                          <CheckoutProvider>
                          <AccessibilitySkipLink />
                          <AppWithAnalytics />
                          <SpeedInsights />
                          <OfflineCacheManager />
                          </CheckoutProvider>
                        </SelectiveCartProvider>
                      </CartProvider>
                    </FlashSaleProvider>
                  </NotificationProvider>
                </ABTestProvider>
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </HelmetProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
