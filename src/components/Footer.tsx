import React from 'react';
import { Link, useLocation } from 'react-router-dom';  // <-- import useLocation
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileUserAgent } from "@/hooks/use-mobile";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {  
  const isMobile = isMobileUserAgent();
  const location = useLocation();  // get current route pathname

  if (isMobile) return null;

   const exactHidePaths = ['/search', '/cart', '/wishlist'];

  // Path prefixes — hide on any route that starts with these
  const prefixHidePaths = ['/category', '/product'];

  const shouldHideFooter =
    exactHidePaths.includes(location.pathname) ||
    prefixHidePaths.some(prefix => location.pathname.startsWith(prefix));
    
  if (location.pathname === '/auth') return null;
  if (location.pathname.startsWith('/supersmartkenyaadmin123')) {
    return null;
  }

  // Organized footer sections for better sitelinks structure
  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/' },
        { label: 'Categories', href: '/' },
        { label: 'Featured Deals', href: '/' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Help Center', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Track Your Order', href: '/orders' },
        { label: 'Returns Policy', href: '/returns' },
      ]
    },
    {
      title: 'Account',
      links: [
        { label: 'My Account', href: '/account' },
        { label: 'Order History', href: '/orders' },
        { label: 'Wishlist', href: '/wishlist' },
        { label: 'Profile Settings', href: '/profile' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ]
    }
  ];
  
  return (
    <>
      {/* Organization Schema for Footer */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "SmartKenya",
          "url": "https://smartkenya.co.ke",
          "logo": "https://smartkenya.co.ke/apple-touch-icon.png",
          "contactPoint": [
            {
              "@type": "ContactPoint",
              "telephone": "+254758475467",
              "contactType": "customer service",
              "email": "info@smartkenya.co.ke",
              "availableLanguage": ["English", "Swahili"]
            }
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "38-60100 Embu Town",
            "addressLocality": "Embu",
            "addressCountry": "Kenya"
          },
          "sameAs": [
            "https://facebook.com/smartkenya",
            "https://twitter.com/smartkenya",
            "https://instagram.com/smartkenya"
          ]
        })}
      </script>

      <footer className={cn("text-white", className)}> 
        {/* Conditionally render main footer content */}
        {!shouldHideFooter && (
          <div className='bg-gray-50 w-full py-8'>
            <div className="max-w-7xl container mb-8" style={{ textAlign: 'justify' }}>
            <h3 className="font-bold text-2xl mb-4 text-gray-900">SmartKenya Online Shopping - Kenya</h3>
            <p className="font-semibold text-gray-600 text-base leading-relaxed">
              SmartKenya is Kenya's leading online shopping platform, launched in 2025 with the mission to make high-quality electronics, gadgets, and accessories accessible to every Kenyan. Our journey began with a simple yet powerful vision: to provide a seamless online shopping experience that offers convenience, variety, and competitive prices. SmartKenya offers wide range of product categories, including smartphones, laptops, home appliances, fashion, beauty products, baby items and more.
            </p>
            <p className="font-semibold text-gray-600 text-base leading-relaxed mt-2">
              As we continue to grow, we remain dedicated to enriching the lives of our customers by providing them with top-tier products, exceptional customer service and a shopping experience that is second to none. Our platform supports a secure M-Pesa payment options, ensuring convenience and flexibility for our customers.
            </p>
            <p className="font-semibold text-gray-600 text-base leading-relaxed mt-2">
              SmartKenya's commitment to innovation means we're constantly evolving to meet the needs of the modern shopper. We have curated partnerships with leading local brands to bring you the latest products at the best prices, while also offering exclusive discounts and promotional deals. Our customer-first approach is reflected in our dedicated customer support.
            </p>
            <p className="font-bold text-gray-900 text-xl py-3">Why Choose SmartKenya?</p>
            <ul className="font-semibold text-gray-600 leading-relaxed text-base list-disc list-inside space-y-2" style={{ textAlign: 'justify' }}>
              <li>Verified Reviews: Browse genuine customer reviews to make informed purchasing decisions.</li>
              <li>Secure Payments: Enjoy Mpesa payment method.</li>
              <li>Order Tracking: Track your deliveries from picking to final destination for complete transparency.</li>
              <li>Trusted Sellers: Shop with confidence from certified sellers across various categories.</li>
              <li>Competitive Prices: Enjoy discounts on high-quality electronics, gadgets, home appliances and more.</li>
              <li>Premium Brands: Find top brands such as Samsung, Huawei, Apple, LG, Sony, Xiaomi, Tecno and more.</li>
              <li>Convenient Shopping: Browse and shop from a wide selection of mobile phones, fashion, beauty products, home & kitchen items, sports goods and more.</li>
            </ul>
          </div>
          </div>
        )}

        <div className='pt-8 bg-gray-100'>
        {/* Footer Links & Social Icons */}
        <div className="max-w-7xl container grid grid-cols-6 mb-8">
          {footerSections.map((section) => (
            <div key={section.title} className="min-w-0">
              <h3 className="font-bold text-gray-900 text-xl mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-gray-600 hover:text-orange-500 transition-colors text-sm block truncate"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold text-gray-900 text-xl mb-3">Follow Us</h4>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com/smartkenya"
                className="text-gray-500 hover:text-orange-500 transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/smartkenya"
                className="text-gray-500 hover:text-orange-500 transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/smartkenya"
                className="text-gray-500 hover:text-orange-500 transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/smartkenya"
                className="text-gray-500 hover:text-orange-500 transition-colors"
                aria-label="Subscribe to our YouTube channel"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="order-1 sm:order-2">
            <h4 className="font-bold text-xl text-gray-900 mb-3">We Accept</h4>
            <div className="flex flex-wrap gap-2">
              <div className="bg-green-800 text-white px-3 py-1 rounded text-xs font-bold">M-PESA</div>
              <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Card</div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 py-4">
          <p className="text-center text-gray-700 text-xs leading-relaxed">
            © {new Date().getFullYear()} SmartKenya. All rights reserved. Designed for Kenya, Built with ❤️
          </p>
        </div>
        </div>

      </footer>
    </>
  );
};

export default Footer;
