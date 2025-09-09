import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import CategoryIcons from '@/components/CategoryIcons';
import EnhancedHeroSection from '@/components/enhanced/EnhancedHeroSection';
import EnhancedFeaturedProducts from '@/components/enhanced/EnhancedFeaturedProducts';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
import { ProductionOptimizer } from '@/components/ProductionOptimizer';
import { SEOHelmet } from '@/components/SEOHelmet';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = isMobileUserAgent();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Handle auth redirects from Supabase
  useEffect(() => {
    const code = searchParams.get('code');
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    
    // Check hash parameters as well (common for auth callbacks)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    const hashType = hashParams.get('type');
    const hashError = hashParams.get('error');
    
    // If we have auth-related parameters, redirect to appropriate auth page
    const hasAuthParams = code || accessToken || refreshToken || type || error ||
                         hashAccessToken || hashRefreshToken || hashType || hashError;
    
    if (hasAuthParams) {
      // For password recovery, redirect to reset password page
      if (type === 'recovery' || hashType === 'recovery' || 
          (accessToken && refreshToken) || (hashAccessToken && hashRefreshToken)) {
        console.log('Redirecting to reset password page with auth params');
        // Preserve all parameters for the reset password page
        const params = new URLSearchParams();
        
        // Add search params
        searchParams.forEach((value, key) => {
          params.set(key, value);
        });
        
        // Add hash params
        hashParams.forEach((value, key) => {
          params.set(key, value);
        });
        
        navigate(`/auth/reset-password?${params.toString()}`, { replace: true });
        return;
      }
      
      // For other auth flows, redirect to sign in page
      if (code && !type) {
        console.log('Redirecting to sign in page with auth code');
        navigate('/auth/signin', { replace: true });
        return;
      }
    }
  }, [searchParams, navigate]);
  
  return (
    <>
      <SEOHelmet
        title="SmartKenya - Quality Electronics & Gadgets Online Shopping"
        description="Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed."
        keywords="electronics, gadgets, smartphones, laptops, accessories, Kenya, online shopping, fast delivery, best prices"
        canonical="https://smartkenya.co.ke"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SmartKenya - Quality Electronics & Gadgets Online Shopping",
          "description": "Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed.",
          "url": "https://smartkenya.co.ke",
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://smartkenya.co.ke",
            "logo": "https://smartkenya.co.ke/apple-touch-icon.png",
            "sameAs": [
              "https://twitter.com/Smartkenya_Online_Shopping"
            ]
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              }
            ]
          }
        }}
      />
      <CriticalCSS />
      <ProductionOptimizer />
      
      <div className={`min-h-screen flex flex-col bg-gray-50`}>
        <PerformanceMonitor />
        <main className={`flex-grow`}>
          <div className={`${!isMobile ? 'min-w-max' : ''}`}>
            <Header />
            <div className="relative">
              <EnhancedHeroSection />
              {!isMobile && <CategoryIcons />}
            </div>
            {isMobile && <CategoryIcons />}
            <EnhancedFeaturedProducts />
            <Footer />
          </div>
          <MobileNav />
        </main>
      </div>
    </>
  );
};

export default Index;
