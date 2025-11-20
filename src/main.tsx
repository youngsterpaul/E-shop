import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { initSentry } from './lib/sentry';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/contexts/CartContext';
import { SelectiveCartProvider } from '@/contexts/SelectiveCartContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
//import { CookieConsent } from '@/components/CookieConsent';
//import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { OfflineCacheManager } from '@/components/OfflineCacheManager';
import { AccessibilitySkipLink } from '@/components/AccessibilitySkipLink';
import { ProductionAnalytics } from '@/components/ProductionAnalytics';
import { ProductionOptimizer } from '@/components/ProductionOptimizer';
import { VersionManager } from '@/components/VersionManager';
//import { UpdateNotification } from '@/components/UpdateNotification';
// import { CacheManager } from '@/components/CacheManager';
import { useErrorReporting } from '@/hooks/useErrorReporting';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from "@vercel/analytics/next"
import App from './App.tsx';
import './index.css';
import { ScrollToTop } from '@/components/ScrollToTop';

// Initialize Sentry before anything else
initSentry();

const AppWithAnalytics = () => {
  useErrorReporting();
  return (
    <>
      <ProductionOptimizer />
      <VersionManager />
      <App />
      <ProductionAnalytics />
      {/* <UpdateNotification /> */}
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
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <CartProvider>
                <SelectiveCartProvider>
                  <CheckoutProvider>
                    <AccessibilitySkipLink />
                    <AppWithAnalytics />
                    {/* <CookieConsent /> */}
                    <SpeedInsights />
                    {/* <Analytics />*/}
                    {/* <PWAInstallPrompt /> */}
                    <OfflineIndicator />
                    <OfflineCacheManager />
                  </CheckoutProvider>
                </SelectiveCartProvider>
              </CartProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  </StrictMode>
);
