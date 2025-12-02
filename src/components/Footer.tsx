import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileUserAgent } from "@/hooks/use-mobile";
import { useContactSettings } from '@/hooks/useContactSettings';

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {  
  const isMobile = isMobileUserAgent();
  const location = useLocation();
  const { settings } = useContactSettings();

  if (isMobile) return null;

  const exactHidePaths = ['/search', '/cart', '/wishlist'];
  const prefixHidePaths = ['/category', '/product'];

  const shouldHideFooter =
    exactHidePaths.includes(location.pathname) ||
    prefixHidePaths.some(prefix => location.pathname.startsWith(prefix));
    
  if (location.pathname === '/auth') return null;
  if (location.pathname.startsWith('/supersmartkenyaadmin123') || location.pathname.startsWith('/checkout')) {
    return null;
  }

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

  // Build social links dynamically
  const socialLinks = [
    { url: settings.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: settings.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: settings.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: settings.youtube_url, icon: Youtube, label: 'YouTube' },
    { url: settings.tiktok_url, icon: Music2, label: 'TikTok' },
  ].filter(link => link.url);

  // Phone number formatted for schema
  const phoneForSchema = settings.phone.replace(/\s/g, '');
  
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
              "telephone": phoneForSchema,
              "contactType": "customer service",
              "email": settings.email,
              "availableLanguage": ["English", "Swahili"]
            }
          ],
          "address": {
            "@type": "PostalAddress",
            "streetAddress": settings.address,
            "addressCountry": "Kenya"
          },
          "sameAs": socialLinks.map(link => link.url)
        })}
      </script>

      <footer className={cn(`text-white ${!isMobile ? 'min-w-max':''}`, className)}> 
        {!shouldHideFooter && (
          <div className='bg-gray-50 w-full py-8'>
            <div className="max-w-6xl lg:max-w-7xl container mb-8" style={{ textAlign: 'justify' }}>
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
          <div className="max-w-6xl lg:max-w-7xl container grid grid-cols-6 mb-8">
            {footerSections.map((section) => (
              <div key={section.title} className="min-w-0">
                <h3 className="font-bold text-gray-900 text-xl mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link, idx) => (
                    <li key={`${section.title}-${link.href}-${idx}`}>
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
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    className="text-gray-500 hover:text-orange-500 transition-colors"
                    aria-label={`Follow us on ${social.label}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            <div className="order-1 sm:order-2">
              <h4 className="font-bold text-xl text-gray-900 mb-3">We Accept</h4>
              <div className="flex flex-wrap gap-2">
                <div className="bg-green-800 text-white px-3 py-1 rounded text-xs font-bold">M-PESA</div>
                <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Card</div>
              </div>
            </div>
          </div>

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
