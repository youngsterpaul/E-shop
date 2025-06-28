import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import EnhancedHeroSection from '@/components/enhanced/EnhancedHeroSection';
import EnhancedFeaturedProducts from '@/components/enhanced/EnhancedFeaturedProducts';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const Index = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <CriticalCSS />
      
      {/* Homepage Schema for better SEO and sitelinks */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SmartKenya - Quality Electronics & Gadgets Online Shopping",
          "description": "Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed.",
          "url": "https://smartkenya.co.ke",
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://smartkenya.co.ke"
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
        })}
      </script>
      
      <div className={`min-h-screen flex flex-col ${!isMobile ? 'min-width-max' : ''}`}>
        <PerformanceMonitor />
        <Header />
        <main className={`flex-grow ${!isMobile ? 'min-w-max' : ''}`}>
          <EnhancedHeroSection />
          <EnhancedFeaturedProducts />
        </main>
        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default Index;