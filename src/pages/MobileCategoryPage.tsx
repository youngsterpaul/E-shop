import CategoryIcons from '@/components/CategoryIcons';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const MobileCategoryPage = () => {
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
      
      <div className={`min-h-screen ${!isMobile ? 'min-w-max' : 'bg-gray-50'}`}>
        <main className="flex-grow pb-16">
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

        {/* Show all categories on category page */}
        <CategoryIcons showAll={true} />
        </main>
      </div>
    </>
  );
};

export default MobileCategoryPage;