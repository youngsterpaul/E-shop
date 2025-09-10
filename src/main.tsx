import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/contexts/CartContext';
import { SelectiveCartProvider } from '@/contexts/SelectiveCartContext';
import { CheckoutProvider } from '@/contexts/CheckoutContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
//import { CookieConsent } from '@/components/CookieConsent';
//import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { AccessibilitySkipLink } from '@/components/AccessibilitySkipLink';
import { ProductionAnalytics } from '@/components/ProductionAnalytics';
import { UpdateNotification } from '@/components/UpdateNotification';
import { CacheManager } from '@/components/CacheManager';
import { useErrorReporting } from '@/hooks/useErrorReporting';
//import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App.tsx';
import './index.css';

const AppWithAnalytics = () => {
  useErrorReporting();
  return (
    <>
      <CacheManager />
      <App />
      <ProductionAnalytics />
      <UpdateNotification />
    </>
  );
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <CartProvider>
                <SelectiveCartProvider>
                  <CheckoutProvider>
                    <AccessibilitySkipLink />
                    <AppWithAnalytics />
                    {/* <CookieConsent /> */}
                    {/* <PWAInstallPrompt /> */}
                    <OfflineIndicator />
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
