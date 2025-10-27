<<<<<<< HEAD
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
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <SEOHelmet
        title="SmartKenya - Quality Electronics & Gadgets Online Shopping"
        description="Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed."
        keywords="electronics, gadgets, smartphones, laptops, accessories, Kenya, online shopping, fast delivery, best prices"
        canonical="https://www.smartkenya.co.ke"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SmartKenya - Quality Electronics & Gadgets Online Shopping",
          "description": "Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed.",
          "url": "https://www.smartkenya.co.ke",
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://www.smartkenya.co.ke",
            "logo": "https://www.smartkenya.co.ke/apple-touch-icon.png",
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
                "item": "https://www.smartkenya.co.ke"
              }
            ]
          }
        }}
      />
      <CriticalCSS />
      <ProductionOptimizer />
      
      <div className={`min-h-screen ${!isMobile ? 'min-w-max bg-violet-50' : 'bg-gray-50'}`}>
        <PerformanceMonitor />
        {isMobile && <Header />}

        <main className={`flex-grow pb-8 ${!isMobile ? 'container px-0 xl:px-24' : ''}`}>
          <div className="relative"> {/* Changed from "absolut" to "relative" - this was likely a typo */}
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /mb-6' : 'mb-8 relative /z-40'}> {/* Added relative z-40 for desktop */}
              <EnhancedHeroSection />
            </div>

            
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4 /mb-6' : 'mb-8 relative /z-10'}> {/* Added relative z-10 */}
              <CategoryIcons showAll={false} />
            </div>
            
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4' : 'relative z-10'}> {/* Added relative z-10 */}
              <EnhancedFeaturedProducts />
            </div>
          </div>
        </main>      
      </div>
    </>
  );
};

=======
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
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <SEOHelmet
        title="SmartKenya - Quality Electronics & Gadgets Online Shopping"
        description="Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed."
        keywords="electronics, gadgets, smartphones, laptops, accessories, Kenya, online shopping, fast delivery, best prices"
        canonical="https://www.smartkenya.co.ke"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "SmartKenya - Quality Electronics & Gadgets Online Shopping",
          "description": "Shop the latest electronics, gadgets, and tech accessories at SmartKenya. Fast delivery across Kenya. Best prices guaranteed.",
          "url": "https://www.smartkenya.co.ke",
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://www.smartkenya.co.ke",
            "logo": "https://www.smartkenya.co.ke/apple-touch-icon.png",
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
                "item": "https://www.smartkenya.co.ke"
              }
            ]
          }
        }}
      />
      <CriticalCSS />
      <ProductionOptimizer />
      
      <div className={`min-h-screen ${!isMobile ? 'min-w-max bg-violet-50' : 'bg-gray-50'}`}>
        <PerformanceMonitor />
        <Header />
        
        <main className={`flex-grow pb-8 ${!isMobile ? 'container px-0 xl:px-24' : ''}`}>
          <div className="relative"> {/* Changed from "absolut" to "relative" - this was likely a typo */}
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /mb-6' : 'mb-8 relative /z-40'}> {/* Added relative z-40 for desktop */}
              <EnhancedHeroSection />
            </div>

            
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4 /mb-6' : 'mb-8 relative /z-10'}> {/* Added relative z-10 */}
              <CategoryIcons showAll={false} />
            </div>
            
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4' : 'relative z-10'}> {/* Added relative z-10 */}
              <EnhancedFeaturedProducts />
            </div>
          </div>
        </main>
        
        {!isMobile && <Footer />}
        {isMobile && <MobileNav />}
      </div>
    </>
  );
};

>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
export default Index;