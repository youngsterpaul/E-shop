import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isMobileUserAgent } from "@/hooks/use-mobile";

interface FooterProps {
  className?: string;
}

const Footer = ({ className }: FooterProps) => {  
  const isMobile = isMobileUserAgent();
  if (isMobile) return null;

  // Organized footer sections for better sitelinks structure
  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'All Products', href: '/products' },
        { label: 'Categories', href: '/categories' },
        { label: 'Best Sellers', href: '/categories' },
        { label: 'Featured Deals', href: '/categories' },
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
              "telephone": "+254798229783",
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

      <footer className={cn("bg-gray-900 text-white w-full", className)}>
        <div className={`w-full container mx-auto px-4 /sm:px-6 /lg:px-8 py-12 ${!isMobile ? 'min-w-max' : ''}`}>
          {/* Main Footer Content */}
          <div className="mb-8">
              <h3 className="font-bold text-xl mb-4">SmartKenya</h3>
              <p className="font-semibold text-gray-400 text-xs leading-relaxed">
                SmartKenya Your one-stop shop for quality electronics and gadgets.
              </p>
            </div>
              
            <div className="grid grid-cols-6 mb-8">
              
              {/* Dynamic Footer Sections */}
              {footerSections.map((section) => (
                <div key={section.title} className="min-w-0">
                  <h3 className="font-semibold text-white mb-4">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link 
                          to={link.href} 
                          className="text-gray-400 hover:text-orange-500 transition-colors text-sm block truncate"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

            <div>
              
                <h4 className="font-medium text-sm mb-3">Follow Us</h4>
                <div className="flex space-x-4">
                  <a 
                    href="https://facebook.com/smartkenya" 
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label="Follow us on Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://twitter.com/smartkenya" 
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label="Follow us on Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://instagram.com/smartkenya" 
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                  <a 
                    href="https://youtube.com/smartkenya" 
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                    aria-label="Subscribe to our YouTube channel"
                  >
                    <Youtube className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              {/* Payment Methods */}
              <div className="order-1 sm:order-2">
                <h4 className="font-medium text-sm mb-3">We Accept</h4>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-green-800 text-white px-3 py-1 rounded text-xs font-bold">M-PESA</div>
                  <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">Card</div>
                </div>
              </div>
            </div>
          </div>
        {/* Copyright - takes full width on mobile, aligned right on larger screens */}
        <div className="border-t border-gray-700 py-4">
          <p className="text-center text-white-500 text-xs leading-relaxed">
            © {new Date().getFullYear()} SmartKenya. All rights reserved. Designed for Kenya, Built with ❤️
          </p>
        </div>
      </footer>
    </>
  );
};

export default Footer;