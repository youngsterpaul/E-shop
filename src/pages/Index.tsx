import React from 'react';
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
      
      <div className={`min-h-screen flex flex-col`}>
        <PerformanceMonitor />
        <main className={`flex-grow`}>
          <div className={`${!isMobile ? 'min-w-max' : ''}`}>
            <Header />
            <EnhancedHeroSection />
            <CategoryIcons />
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