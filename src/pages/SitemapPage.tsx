
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Home, 
  ShoppingBag, 
  Info, 
  BookOpen, 
  Users, 
  HelpCircle,
  Calendar,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface SitemapItem {
  title: string;
  url: string;
  description?: string;
  isExternal?: boolean;
  children?: SitemapItem[];
}

const SitemapPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['home', 'products']);
  const isMobile = isMobileUserAgent();
  const sitemapData: SitemapItem[] = [
    {
      title: 'Home',
      url: '/',
      description: 'Main landing page with featured products and promotions',
      children: [
        { title: 'About Us', url: '/about', description: 'Learn about our company story and mission' },
        { title: 'Our Services', url: '/services', description: 'Comprehensive overview of our offerings' },
        { title: 'Testimonials', url: '/testimonials', description: 'Customer reviews and success stories' },
        { title: 'Contact', url: '/contact', description: 'Get in touch with our team' }
      ]
    },
    {
      title: 'Products & Services',
      url: '/products',
      description: 'Browse our complete product catalog',
      children: [
        { title: 'All Products', url: '/products', description: 'Complete product listing' },
        { title: 'Categories', url: '/categories', description: 'Browse products by category' },
        { title: 'Featured Products', url: '/products?featured=true', description: 'Our top recommended items' },
        { title: 'New Arrivals', url: '/products?new=true', description: 'Latest additions to our catalog' },
        { title: 'Sale Items', url: '/products?sale=true', description: 'Discounted products and special offers' },
        { title: 'Pricing', url: '/pricing', description: 'Transparent pricing for all services' },
        { title: 'Case Studies', url: '/case-studies', description: 'Real-world success stories' }
      ]
    },
    {
      title: 'Shopping',
      url: '/cart',
      description: 'Shopping and checkout experience',
      children: [
        { title: 'Shopping Cart', url: '/cart', description: 'View and manage your cart items' },
        { title: 'Wishlist', url: '/wishlist', description: 'Save items for later purchase' },
        { title: 'Checkout', url: '/checkout', description: 'Complete your purchase securely' },
        { title: 'Order Tracking', url: '/orders', description: 'Track your order status' },
        { title: 'Search', url: '/search', description: 'Find specific products quickly' }
      ]
    },
    {
      title: 'Account & Profile',
      url: '/account',
      description: 'Manage your account and preferences',
      children: [
        { title: 'Sign In', url: '/auth/signin', description: 'Access your existing account' },
        { title: 'Sign Up', url: '/auth/signup', description: 'Create a new account' },
        { title: 'Profile', url: '/profile', description: 'Manage your personal information' },
        { title: 'Account Settings', url: '/account', description: 'Update account preferences' },
        { title: 'Order History', url: '/orders', description: 'View past purchases and orders' },
        { title: 'Password Reset', url: '/auth/forgot-password', description: 'Reset your account password' }
      ]
    },
    {
      title: 'Resources',
      url: '/resources',
      description: 'Helpful information and downloads',
      children: [
        { title: 'Blog', url: '/blog', description: 'Latest news and insights' },
        { title: 'Downloads', url: '/downloads', description: 'Useful files and resources' },
        { title: 'FAQ', url: '/faq', description: 'Frequently asked questions' },
        { title: 'Documentation', url: '/docs', description: 'Technical documentation and guides' },
        { title: 'API Reference', url: '/api-docs', description: 'Developer resources and API docs' }
      ]
    },
    {
      title: 'Company',
      url: '/company',
      description: 'Learn more about our organization',
      children: [
        { title: 'About', url: '/about', description: 'Our company story and values' },
        { title: 'Team', url: '/team', description: 'Meet our talented team members' },
        { title: 'Careers', url: '/careers', description: 'Join our growing team' },
        { title: 'News & Updates', url: '/news', description: 'Latest company announcements' },
        { title: 'Press Kit', url: '/press', description: 'Media resources and brand assets' },
        { title: 'Investor Relations', url: '/investors', description: 'Information for investors' }
      ]
    },
    {
      title: 'Support',
      url: '/support',
      description: 'Get help and support',
      children: [
        { title: 'Help Center', url: '/help', description: 'Comprehensive help documentation' },
        { title: 'Contact Us', url: '/contact', description: 'Multiple ways to reach our support team' },
        { title: 'Live Chat', url: '/chat', description: 'Real-time customer support' },
        { title: 'Shipping Info', url: '/shipping', description: 'Delivery options and information' },
        { title: 'Returns & Exchanges', url: '/returns', description: 'Return policy and process' },
        { title: 'Warranty', url: '/warranty', description: 'Product warranty information' }
      ]
    },
    {
      title: 'Legal',
      url: '/legal',
      description: 'Legal information and policies',
      children: [
        { title: 'Privacy Policy', url: '/privacy', description: 'How we handle your personal data' },
        { title: 'Terms of Service', url: '/terms', description: 'Terms and conditions of use' },
        { title: 'Cookie Policy', url: '/cookies', description: 'Information about our cookie usage' },
        { title: 'GDPR Compliance', url: '/gdpr', description: 'Data protection and privacy rights' },
        { title: 'Accessibility', url: '/accessibility', description: 'Our commitment to accessibility' }
      ]
    }
  ];

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(title => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const filteredSitemap = sitemapData.map(section => ({
    ...section,
    children: section.children?.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (section.children && section.children.length > 0)
  );

  const getSectionIcon = (title: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Home': <Home className="w-5 h-5" />,
      'Products & Services': <ShoppingBag className="w-5 h-5" />,
      'Shopping': <ShoppingBag className="w-5 h-5" />,
      'Account & Profile': <Users className="w-5 h-5" />,
      'Resources': <BookOpen className="w-5 h-5" />,
      'Company': <Info className="w-5 h-5" />,
      'Support': <HelpCircle className="w-5 h-5" />,
      'Legal': <Info className="w-5 h-5" />
    };
    return iconMap[title] || <Home className="w-5 h-5" />;
  };

  return (
    <>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title={'SiteMap'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      {/* Breadcrumb */}
      <section className="py-4 px-4 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Site Map</span>
          </nav>
        </div>
      </section>

      <Helmet>
        <title>Site Map - Navigate Our Website</title>
        <meta name="description" content="Complete site navigation and page directory. Find any page or section quickly and easily." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <section className="py-12 px-4 bg-white border-b">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Site Map</h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Navigate through all pages and sections of our website. Use the search below to quickly find what you're looking for.
              </p>
            </div>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search pages and sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-center"
              />
            </div>
          </div>
        </section>

        {/* Sitemap Content */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6">
              {filteredSitemap.map((section) => (
                <Card key={section.title} className="overflow-hidden">
                  <Collapsible
                    open={expandedSections.includes(section.title.toLowerCase().replace(/\s+/g, '-'))}
                    onOpenChange={() => toggleSection(section.title.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              {getSectionIcon(section.title)}
                            </div>
                            <div className="text-left">
                              <CardTitle className="text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                                {section.title}
                              </CardTitle>
                              {section.description && (
                                <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {section.children && (
                              <Badge variant="secondary" className="text-xs">
                                {section.children.length} pages
                              </Badge>
                            )}
                            <ChevronDown 
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                expandedSections.includes(section.title.toLowerCase().replace(/\s+/g, '-')) 
                                  ? 'rotate-180' 
                                  : ''
                              }`} 
                            />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    {section.children && (
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {section.children.map((item) => (
                              <div
                                key={item.url}
                                className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                      {item.title}
                                    </h4>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <Link
                                        to={item.url}
                                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                      >
                                        Visit page
                                        {item.isExternal ? (
                                          <ExternalLink className="w-3 h-3 ml-1" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 ml-1" />
                                        )}
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                </Card>
              ))}
            </div>

            {filteredSitemap.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No pages found matching your search.</p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Footer Info */}
        <section className="py-8 px-4 bg-gray-50 border-t">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-600 mb-2">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-sm text-gray-500">
              Can't find what you're looking for? <Link to="/contact" className="text-blue-600 hover:underline">Contact us</Link> for assistance.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default SitemapPage;
