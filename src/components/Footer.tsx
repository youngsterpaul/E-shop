
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
        { label: 'Best Sellers', href: '/bestsellers' },
        { label: 'Featured Deals', href: '/deals' },
        { label: 'Brands', href: '/brands' },
      ]
    },
    {
      title: 'Customer Service',
      links: [
        { label: 'Help Center', href: '/faq' },
        { label: 'Contact Us', href: '/contact' },
        { label: 'Track Your Order', href: '/orders' },
        { label: 'Shipping Information', href: '/shipping' },
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
        { label: 'Sign In', href: '/auth/signin' },
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
        { label: 'Sitemap', href: '/sitemap' },
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

      <footer className={cn("bg-gray-900 text-white pt-12 pb-6", className)}>
        <div className="container">
          <div className="grid grid-cols-5 gap-8 mb-8">
            {/* Company Info */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-xl mb-4">SmartKenya</h3>
              <p className="text-gray-400 mb-4">
                Your one-stop shop for quality electronics and gadgets. We deliver nationwide across Kenya.
              </p>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-gray-300">+254 798 229 783</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-orange-500 mr-2" />
                  <span className="text-gray-300">info@smartkenya.co.ke</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-orange-500 mr-2 mt-1" />
                  <span className="text-gray-300">38-60100 Embu Town, Embu, Kenya</span>
                </div>
              </div>
            </div>
            
            {/* Dynamic Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-bold text-lg mb-4">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link 
                        to={link.href} 
                        className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          {/* Social Media & Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 border-b border-gray-700">
            <div>
              <h4 className="font-medium text-sm mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com/smartkenya" 
                  className="text-gray-400 hover:text-orange-500"
                  aria-label="Follow us on Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a 
                  href="https://twitter.com/smartkenya" 
                  className="text-gray-400 hover:text-orange-500"
                  aria-label="Follow us on Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://instagram.com/smartkenya" 
                  className="text-gray-400 hover:text-orange-500"
                  aria-label="Follow us on Instagram"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a 
                  href="https://youtube.com/smartkenya" 
                  className="text-gray-400 hover:text-orange-500"
                  aria-label="Subscribe to our YouTube channel"
                >
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">We Accept</h4>
              <div className="flex space-x-3">
                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">M-PESA</div>
                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">Card</div>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} SmartKenya. All rights reserved. | Designed for Kenya, Built with ❤️</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
