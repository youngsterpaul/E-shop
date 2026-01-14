import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Music2, MapPin, Phone, Mail, Clock } from 'lucide-react';
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
        { label: 'Flash Sales', href: '/flash-sales' },
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

  const socialLinks = [
    { url: settings.facebook_url, icon: Facebook, label: 'Facebook' },
    { url: settings.twitter_url, icon: Twitter, label: 'Twitter' },
    { url: settings.instagram_url, icon: Instagram, label: 'Instagram' },
    { url: settings.youtube_url, icon: Youtube, label: 'YouTube' },
    { url: settings.tiktok_url, icon: Music2, label: 'TikTok' },
  ].filter(link => link.url);

  const phoneForSchema = settings.phone.replace(/\s/g, '');

  return (
    <>
      {/* Organization Schema */}
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

      <footer className={cn('bg-background border-t border-border/40', !isMobile && 'min-w-max min-w-[1400px]', className)}>
        {/* About Section */}
        {!shouldHideFooter && (
          <div className="bg-muted/30 py-12">
            <div className="container max-w-6xl lg:max-w-7xl">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-foreground">SmartKenya Online Shopping - Kenya</h3>
                <div className="prose prose-sm max-w-none text-muted-foreground space-y-3" style={{ textAlign: 'justify' }}>
                  <p className="leading-relaxed">
                    SmartKenya is Kenya's leading online shopping platform, launched in 2025 with the mission to make high-quality electronics, gadgets, and accessories accessible to every Kenyan. Our journey began with a simple yet powerful vision: to provide a seamless online shopping experience that offers convenience, variety, and competitive prices.
                  </p>
                  <p className="leading-relaxed">
                    As we continue to grow, we remain dedicated to enriching the lives of our customers by providing them with top-tier products, exceptional customer service and a shopping experience that is second to none. Our platform supports secure M-Pesa payment options, ensuring convenience and flexibility.
                  </p>
                </div>

                <div className="pt-4">
                  <h4 className="text-lg font-bold text-foreground mb-4">Why Choose SmartKenya?</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { title: 'Verified Reviews', desc: 'Genuine customer feedback' },
                      { title: 'Secure Payments', desc: 'M-Pesa & Card accepted' },
                      { title: 'Order Tracking', desc: 'Real-time delivery updates' },
                      { title: 'Trusted Sellers', desc: 'Certified quality assurance' },
                    ].map((item) => (
                      <div key={item.title} className="bg-background rounded-xl p-4 border border-border/50">
                        <h5 className="font-semibold text-foreground text-sm">{item.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Footer */}
        <div className="py-12 bg-background">
          <div className="container max-w-6xl lg:max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
              {/* Footer Links */}
              {footerSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <h3 className="font-bold text-foreground">{section.title}</h3>
                  <ul className="space-y-2.5">
                    {section.links.map((link, idx) => (
                      <li key={`${section.title}-${link.href}-${idx}`}>
                        <Link
                          to={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Social Links */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground">Follow Us</h3>
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      className="p-2.5 rounded-full bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                      aria-label={`Follow us on ${social.label}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <social.icon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground">We Accept</h3>
                <div className="flex flex-wrap gap-2">
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
                    M-PESA
                  </div>
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
                    Card
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border/40 py-6 bg-muted/20">
          <div className="container max-w-6xl lg:max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} SmartKenya. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Designed for Kenya, Built with ❤️
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
