import { Suspense } from "react";
import { useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import TopProgressBar from './components/TopProgressBar';
import Header from './components/Header';
import Footer from './components/Footer';
import { isMobileUserAgent } from './hooks/use-mobile';
import MobileNav from '@/components/MobileNav';
import { MobileHeader } from './components/ui/mobile-header';
import LoadingSpinner from '@/components/LoadingSpinner';
import SecurityHeaders from './components/SecurityHeaders';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import ChatWidget from './components/chat/ChatWidget';
import { OfflineDataPreloader } from './components/OfflineDataPreloader';
import { useSwipeBack } from './hooks/useSwipeBack';
import { useUserBehaviorTracking } from './hooks/useUserBehaviorTracking';
import { useMobileHeaderProps } from './hooks/useMobileHeaderProps';
import AppRoutes from './routes/AppRoutes';

function App() {
  useSessionTimeout();
  useUserBehaviorTracking();

  const location = useLocation();
  const isMobile = isMobileUserAgent();
  const isAdminRoute = location.pathname.startsWith("/supersmartkenyaadmin123");
  const isAuthRoute = location.pathname.startsWith("/auth");
  const isSearchPage = location.pathname.startsWith("/search");
  const isCategoryPage = location.pathname.startsWith("/category/");
  const isHomePage = location.pathname === "/";

  const { title, backTo, rightAction } = useMobileHeaderProps();

  return (
    <TooltipProvider>
      <SecurityHeaders />
      <OfflineDataPreloader />
      <TopProgressBar />
      <div className="flex flex-col min-h-screen bg-background">
        {!isMobile && !isAdminRoute && !isAuthRoute && <Header />}
        {isMobile && !isAdminRoute && !isHomePage && !isSearchPage && !isCategoryPage && (
          <MobileHeader title={title} backTo={backTo} rightAction={rightAction} />
        )}

        <Suspense fallback={<LoadingSpinner overlay text="Please wait..." />}>
          <main
            id="main-content"
            className={`flex-grow ${isMobile ? 'overflow-y-auto' : ''}`}
            style={
              !isAdminRoute && isMobile
                ? { paddingTop: `52px + env(safe-area-inset-top))` }
                : undefined
            }
          >
            <AppRoutes />
          </main>
        </Suspense>

        {!isMobile && <Footer />}
        {isMobile && <MobileNav />}
        {!isAdminRoute && <ChatWidget />}
      </div>
    </TooltipProvider>
  );
}

export default App;
