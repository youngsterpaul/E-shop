import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useState, useEffect } from 'react';

const Header2 = () => {
  const isMobile = isMobileUserAgent();
  const [isScrolled, setIsScrolled] = useState(false);


  // Main navigation items for sitelinks
  const mainNavItems = [
    { label: 'Home', href: '/', description: 'Return to homepage' },
    { label: 'Customer Service', href: '/contact', description: 'Get help and support' },
    { label: 'About Us', href: '/about', description: 'Learn more about SmartKenya' },
    { label: 'Careers', href: '/careers', description: 'Get your dream job at smartkenya' },
    { label: 'FAQs', href: '/faq', description: 'Get answers to most asked questions' },
    { label: 'Privacy Policy', href: '/privacy', description: 'Know your privacy at smartkenya' },
    { label: 'Returns', href: '/returns', description: 'Return policy' },
    { label: 'T&C', href: '/terms', description: 'Terms and Conditions of Smartkenya' },
  ];

  return (
    <>
      {/* Enhanced Schema for better sitelinks */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://smartkenya.co.ke",
          "name": "SmartKenya Online Shopping",
          "alternateName": "SmartKenya",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://smartkenya.co.ke/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          },
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://smartkenya.co.ke"
          }
        })}
      </script>

      <header 
        className={`w-full sticky top-0 z-50 bg-white transition-shadow duration-200 ${
          isScrolled ? 'shadow-lg border-b border-gray-100' : 'shadow-sm'
        }`}
      >
        {/* Main navigation for desktop */}
        {!isMobile && (
          <nav
            className="border-b border-gray-50 bg-gray-50"
            role="navigation"
            aria-label="Main Navigation"
          >
            <div className="container mx-auto xl:px-24">
              <ul className="flex items-center justify-center space-x-8 py-3">
                {mainNavItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 hover:underline transition-colors duration-150"
                      title={item.description}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        )}

        {/* Logo section */}
        <div className="container mx-auto xl:px-24 px-4 py-6">
          <div className="flex items-center justify-between">
            {/* Professional Logo */}
            <a href="/" className="flex-shrink-0">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                SmartKenya
              </h1>
            </a>
            
          </div>
        </div>
      </header>
    </>
  );
};

export default Header2;