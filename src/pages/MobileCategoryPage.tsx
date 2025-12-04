import CategoryIcons from '@/components/CategoryIcons';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { SEOHelmet } from '@/components/SEOHelmet';

const MobileCategoryPage = () => {
  const isMobile = isMobileUserAgent();
  
  return (
    <>
      <SEOHelmet 
        title="Browse Categories - SmartKenya"
        description="Explore our wide range of product categories including electronics, fashion, home appliances and more at SmartKenya."
        keywords="categories, electronics, fashion, home appliances, Kenya shopping"
        canonical="https://www.smartkenya.co.ke/category"
      />
      
      <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
        <main className="flex-grow pb-20">
          {/* Breadcrumb - Desktop Only */}
          {!isMobile && (
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 pt-6">
              <SiteBreadcrumb 
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Categories' }
                ]}
                className="mb-6"
              />
            </div>
          )}

          {/* Page Header - Desktop Only */}
          {!isMobile && (
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 mb-6">
              <h1 className="text-2xl font-bold text-foreground">All Categories</h1>
              <p className="text-muted-foreground mt-1">Browse products by category</p>
            </div>
          )}

          {/* Category Icons Grid */}
          <div className={isMobile ? '' : 'max-w-[1400px] mx-auto px-4 lg:px-6'}>
            <CategoryIcons showAll={true} />
          </div>
        </main>
      </div>
    </>
  );
};

export default MobileCategoryPage;