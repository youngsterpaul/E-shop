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
import Testimonials from '@/components/Testimonials';
import { WebsiteStructuredData, LocalBusinessStructuredData } from '@/components/seo/StructuredData';

const Index = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <SEOHelmet
        title="Store - Premium Electronics & Everyday Essentials"
        description="Shop quality electronics, gadgets, and everyday essentials with fast delivery and dependable service."
        keywords="electronics, gadgets, essentials, online shopping, quality products, fast delivery"
        canonical="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Store - Premium Electronics & Everyday Essentials",
          "description": "Shop quality electronics, gadgets, and everyday essentials with fast delivery and dependable service.",
          "url": "/",
          "mainEntity": {
            "@type": "Organization",
            "name": "Store",
            "url": "/",
          },
        }}
      />
      <CriticalCSS />
      
      {/* SEO Structured Data */}
      <WebsiteStructuredData 
        name="Online Store"
        url="/"
        searchUrl="/search"
      />
      <LocalBusinessStructuredData
        name="Online Store"
        url="/"
        logo="/apple-touch-icon.png"
        telephone=""
        email="info@example.com"
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
          {isMobile && <MobileHeroSearchBar />}

          <section className={isMobile ? 'text-center py-3 px-4' : 'text-center py-4'}>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Youngsters Fashion Hub
            </h1>
          </section>

          <section className={isMobile ? '' : 'py-4'}>
            <EnhancedHeroSection />
          </section>

          <section className={isMobile ? 'mt-4' : 'mt-6'}>
            <FlashSaleBanner />
          </section>
          
          {!isMobile && (
            <section className="mt-6 bg-card rounded-xl p-6 shadow-sm">
              <CategoryIcons showAll={false} />
            </section>
          )}
          
          <section className={`${isMobile ? '' : 'mt-6'}`}>
            <EnhancedFeaturedProducts />
          </section>

          {!isMobile && (
            <section className="mt-8">
              <TrustBadges />
            </section>
          )}

          {!isMobile && (
            <section>
              <Testimonials variant="carousel" />
            </section>
          )}
        </main>
      </div>
    </>
  );
};

export default Index;