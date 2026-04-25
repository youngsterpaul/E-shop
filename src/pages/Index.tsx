import Header from '@/components/Header';
import CategoryIcons from '@/components/CategoryIcons';
import EnhancedHeroSection from '@/components/enhanced/EnhancedHeroSection';
import MobileHeroSearchBar from '@/components/home/MobileHeroSearchBar';
import EnhancedFeaturedProducts from '@/components/enhanced/EnhancedFeaturedProducts';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
import { SEOHelmet } from '@/components/SEOHelmet';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import TrustBadges from '@/components/TrustBadges';
import NewsletterSubscription from '@/components/NewsletterSubscription';
import Testimonials from '@/components/Testimonials';
import { WebsiteStructuredData, LocalBusinessStructuredData } from '@/components/seo/StructuredData';

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
      
      {/* SEO Structured Data */}
      <WebsiteStructuredData 
        name="SmartKenya"
        url="https://www.smartkenya.co.ke"
        searchUrl="https://www.smartkenya.co.ke/search"
      />
      <LocalBusinessStructuredData
        name="SmartKenya"
        url="https://www.smartkenya.co.ke"
        logo="https://www.smartkenya.co.ke/apple-touch-icon.png"
        telephone="+254798229783"
        email="info@smartkenya.co.ke"
        address={{
          street: "Nairobi",
          city: "Nairobi",
          region: "Nairobi",
          country: "KE"
        }}
        openingHours={["Mo-Su 08:00-20:00"]}
      />
      
      <div className={`min-h-screen ${!isMobile ? 'min-w-max bg-gray-100' : 'bg-background'}`}>
        <PerformanceMonitor />
        {isMobile && <Header />}

        <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6' : ''}`}>
          {/* Mobile search + categories pill rail (above hero) */}
          {isMobile && <MobileHeroSearchBar />}

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
            <section className="mt-6 bg-card /rounded-xl .p-6 shadow-sm">
              <CategoryIcons showAll={false} />
            </section>
          )}
          
          {/* Featured Products */}
          <section className={`${isMobile ? '' : 'mt-6'}`}>
            <EnhancedFeaturedProducts />
          </section>

          {/* Recently Viewed - Desktop Only
          {!isMobile && (
            <section>
              <RecentlyViewedProducts maxItems={6} />
            </section>
          )}
    */}
          {/* Trust Badges - Desktop Only */}
          {!isMobile && (
            <section className="mt-8">
              <TrustBadges />
            </section>
          )}

          {/* Testimonials - Desktop Only */}
          {!isMobile && (
            <section>
              <Testimonials variant="carousel" />
            </section>
          )}

          {/* Newsletter - Desktop Only */}
          {/* 
          {!isMobile && (
            <section className="py-12">
              <NewsletterSubscription />
            </section>
          )}  */}
        </main>

      </div>
    </>
  );
};

export default Index;
