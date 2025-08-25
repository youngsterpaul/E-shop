
import React from 'react';
import Header from '@/components/Header';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AboutPage = () => {
  const isMobile = isMobileUserAgent();

  return (
    <>
      {/* About Page Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "About SmartKenya - SmartKenya",
          "description": "Know more about SmartKenya",
          "url": "https://smartkenya.co.ke/cart",
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://smartkenya.co.ke"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "About",
                "item": "https://smartkenya.co.ke/about"
              }
            ]
          }
        })}
      </script>
          
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && ( 
        <MobileHeader 
        title="About SmartKenya"
        rightAction={
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        }
      />
      )}
        <main className="flex-grow mx-auto px-4 container py-8">
          {/* Breadcrumb */}
          {!isMobile && ( 
            <SiteBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'About SmartKenya' }
            ]}
            className="mb-6"
          />
          )}

        <h1 className="text-3xl font-bold mb-6">About SmartKenya</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <img 
            src="https://via.placeholder.com/1200x400" 
            alt="SmartKenya Team" 
            className="w-full h-64 object-cover" 
          />
          <div className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-700 mb-4">
              Founded in 2025, SmartKenya started with a simple mission: to make quality products accessible to everyone in Kenya and beyond. What began as a small online shop operating out of a garage in Embu has grown into one of East Africa's most trusted e-commerce platforms.
            </p>
            <p className="text-gray-700 mb-4">
              Our name "SmartKenya" combines "Smart" and "Kenya" - representing freshness and vitality - with "S" - symbolizing our forward-thinking approach and commitment to innovation in the African e-commerce space.
            </p>
            <p className="text-gray-700">
              Today, SmartKenya connects thousands of sellers with millions of customers across the region, offering everything from electronics and fashion to home goods and groceries. We remain committed to our core values of quality, accessibility, and exceptional customer service.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            At SmartKenya, we're on a mission to revolutionize how people shop in Africa by creating a seamless, trustworthy online marketplace that empowers both buyers and sellers.
          </p>
          <p className="text-gray-700">
            We strive to provide access to quality products at competitive prices, support local businesses, and contribute to economic growth in the communities we serve.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
              <div className="bg-orange-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="font-medium mb-2">Quality</h3>
              <p className="text-gray-600 text-sm">We carefully vet all products on our platform to ensure they meet our high standards.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
              <div className="bg-orange-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h3 className="font-medium mb-2">Affordability</h3>
              <p className="text-gray-600 text-sm">We work to make high-quality products affordable to as many people as possible.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
              <div className="bg-orange-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <h3 className="font-medium mb-2">Community</h3>
              <p className="text-gray-600 text-sm">We support local businesses and invest in the communities where we operate.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-4 rounded-lg bg-gray-50">
              <div className="bg-orange-100 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
              </div>
              <h3 className="font-medium mb-2">Trust</h3>
              <p className="text-gray-600 text-sm">We build trust through transparent practices and reliable service.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-50 rounded-lg shadow-sm p-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Join Our Journey</h2>
          <p className="text-gray-700 mb-6">
            We're always looking for talented individuals to join our team and help us shape the future of e-commerce in Africa.
          </p>
          <button 
            onClick={() => window.location.href = "/careers"}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md font-medium"
          >
            View Careers
          </button>
        </div>
      </main>
      
    </div>
    </>
  );
};

export default AboutPage;
