
import Header from '@/components/Header';
import MobileNav from '@/components/MobileNav';
import CategoryIcons from '@/components/CategoryIcons';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Search } from 'lucide-react';

const OptimizedProductsPage = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Products - SmartKenya",
          "description": "Filter products by categories, subcategories, price and brands - SmartKenya",
          "url": "https://smartkenya.co.ke/products",
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
                "name": "Category",
                "item": "https://smartkenya.co.ke/category"
              }
            ]
          }
        })}
      </script>
      
      <div className={`flex flex-col min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader
            title={'Product Category'}
            rightAction={
            <Link to="/search">
              <Button variant="ghost" size="sm" className="p-2">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            }
          />
        )}

        <main className="flex-grow pt-6 pb-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            {!isMobile && (
              <SiteBreadcrumb 
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Products' }
                ]}
                className="mb-6"
              />
            )}

        <CategoryIcons />
        </div>
        <MobileNav />
        </main>
      </div>
    </>
  );
};

export default OptimizedProductsPage;
