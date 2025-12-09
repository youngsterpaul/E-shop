import Header from '@/components/Header';
import CategoryIcons from '@/components/CategoryIcons';
import EnhancedHeroSection from '@/components/enhanced/EnhancedHeroSection';
import EnhancedFeaturedProducts from '@/components/enhanced/EnhancedFeaturedProducts';
import FlashSaleBanner from '@/components/FlashSaleBanner';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import CriticalCSS from '@/components/performance/CriticalCSS';
import { SEOHelmet } from '@/components/SEOHelmet';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import TrustBadges from '@/components/TrustBadges';
import RecentlyViewedProducts from '@/components/RecentlyViewedProducts';
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
        telephone="+254700000000"
        email="info@smartkenya.co.ke"
        address={{
          street: "Nairobi",
          city: "Nairobi",
          region: "Nairobi",
          country: "KE"
        }}
        openingHours={["Mo-Su 08:00-20:00"]}
      />
      
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <PerformanceMonitor />
        {isMobile && <Header />}

        <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6' : ''}`}>
          {/* Hero Section */}
          <section className={isMobile ? '' : 'py-4'}>
            <EnhancedHeroSection />
          </section>

            {/* Flash Sale Banner */}
            <div className={isMobile ? 'mb-4 px-4' : 'mb-8'}>
              <FlashSaleBanner />
            </div>
            
            {!isMobile && (
              <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4 /mb-6' : 'mb-8 relative /z-10'}> {/* Added relative z-10 */}
                <CategoryIcons showAll={false} />
              </div>
            )}
            
            <div className={isMobile ? '/bg-white /rounded-lg /shadow-md /p-4' : 'relative z-10'}> {/* Added relative z-10 */}
              <EnhancedFeaturedProducts />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Index;