import Header from '@/components/Header';
import CategoryIcons from '@/components/CategoryIcons';
import EnhancedHeroSection from '@/components/enhanced/EnhancedHeroSection';
import EnhancedFeaturedProducts from '@/components/enhanced/EnhancedFeaturedProducts';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
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
          },
        }}
      />
      <CriticalCSS />
      
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <PerformanceMonitor />
        {isMobile && <Header />}

        <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6' : ''}`}>
          {/* Hero Section */}
          <section className={isMobile ? '' : 'py-4'}>
            <EnhancedHeroSection />
          </section>

          {/* Flash Sale Section */}
          <section className={isMobile ? 'mt-4' : 'mt-6'}>
            <FlashSaleBanner />
          </section>
          
          {/* Category Icons - Desktop Only */}
          {!isMobile && (
            <section className="mt-6 bg-card rounded-xl p-6 shadow-sm">
              <CategoryIcons showAll={false} />
            </section>
          )}
          
          {/* Featured Products */}
          <section className={`${isMobile ? 'mt-4 pb-20' : 'mt-6 mb-8'}`}>
            <EnhancedFeaturedProducts />
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;