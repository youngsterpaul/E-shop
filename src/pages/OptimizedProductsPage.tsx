import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Settings, ArrowRight, Loader2 } from "lucide-react";
import { useCategories } from '@/hooks/useCategories';
import { MobileHeader } from "@/components/ui/mobile-header";
import { isMobileUserAgent } from "@/hooks/use-mobile";
import SiteBreadcrumb from "@/components/Breadcrumb";
import MobileNav from "@/components/MobileNav";
import ProductGrid from "@/components/products/ProductGrid";
import ProductFilters from "@/components/products/ProductFilters";
import ProductHeader from "@/components/products/ProductHeader";
import MobileFiltersModal from "@/components/products/MobileFiltersModal";
import { useProductFilters } from "@/hooks/useProductFilters";
import { useOptimizedProductsData } from "@/hooks/useOptimizedProductsData";
import { Link } from 'react-router-dom';

const OptimizedProductsPage = () => {
  const { categories, subcategories, fetchSubcategories, setSubcategories } = useCategories();
  const isMobile = isMobileUserAgent();
  
  // Mobile filter state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<string[]>([
    "categories",
    "price",
  ]);

  // Product loading state
  const [visibleProductsCount, setVisibleProductsCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Product counts configuration
  const initialDesktopCount = 36;
  const initialMobileCount = 30;
  const loadMoreDesktopCount = 18;
  const loadMoreMobileCount = 15;
  
  // Filter management
  const filters = useProductFilters({
    onFiltersChange: () => {
      // Reset visible products count when filters change
      setVisibleProductsCount(isMobile ? initialMobileCount : initialDesktopCount);
    }
  });

  // Data fetching with optimizations - fetch all products at once
  const { products, totalProducts, isLoading } = useOptimizedProductsData({
    filters: {
      selectedCategories: filters.selectedCategories,
      selectedSubcategories: filters.selectedSubcategories,
      selectedBrands: filters.selectedBrands,
      selectedRatings: filters.selectedRatings,
      priceRange: filters.priceRange,
      sortOption: filters.sortOption,
    },
    currentPage: 1,
    productsPerPage: 1000, // Fetch a large number to get all products
  });

  // Initialize visible products count
  useEffect(() => {
    setVisibleProductsCount(isMobile ? initialMobileCount : initialDesktopCount);
  }, [isMobile]);

  // Update subcategories when categories change
  useEffect(() => {
    const updateFilterOptions = async () => {
      if (filters.selectedCategories.length === 1) {
        const selectedCategory = categories.find(cat => cat.category === filters.selectedCategories[0]);
        if (selectedCategory) {
          await fetchSubcategories(selectedCategory.id);
        }
      } else {
        setSubcategories([]);
      }
    };

    updateFilterOptions();
  }, [filters.selectedCategories, categories, fetchSubcategories, setSubcategories]);

  // Desktop "Show More" handler
  const handleShowMore = useCallback(() => {
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      setVisibleProductsCount(prev => prev + loadMoreDesktopCount);
      setIsLoadingMore(false);
    }, 500);
  }, []);
  
  // Mobile infinite scroll handler
  const handleScroll = useCallback(() => {
    if (isMobile && products && visibleProductsCount < products.length) {
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      
      // Trigger when user is 200px from bottom
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        if (!isLoadingMore) {
          setIsLoadingMore(true);
          
          // Simulate loading delay
          setTimeout(() => {
            setVisibleProductsCount(prev => 
              Math.min(prev + loadMoreMobileCount, products.length)
            );
            setIsLoadingMore(false);
          }, 500);
        }
      }
    }
  }, [isMobile, products, visibleProductsCount, isLoadingMore]);
  
  // Add scroll event listener for mobile
  useEffect(() => {
    if (isMobile) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isMobile, handleScroll]);

  // Toggle filter sections (mobile)
  const toggleFilterSection = (section: string) => {
    if (openFilterSections.includes(section)) {  
      setOpenFilterSections(openFilterSections.filter(s => s !== section));
    } else {
      setOpenFilterSections([...openFilterSections, section]);
    }
  };

  // Transform data for components
  const categoryData = categories.map(cat => ({
    id: cat.id.toString(),
    name: cat.category,
  }));

  const subcategoryData = subcategories.map(subcat => ({
    id: subcat.id.toString(),
    name: subcat.category,
  }));

  // Check if there are more products to show
  const hasMoreProducts = products && visibleProductsCount < products.length;

  // Get visible products
  const visibleProducts = products?.slice(0, visibleProductsCount) || [];

  return (
    <>
      {/* Schema Markup */}
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
                "name": "Products",
                "item": "https://smartkenya.co.ke/products"
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
        />)}

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

            {/* Header with sort and mobile filter toggle */}
            <ProductHeader
              title="All Products"
              productCount={totalProducts}
              sortOption={filters.sortOption}
              onSortChange={filters.setSortOption}
              onFiltersToggle={() => setMobileFiltersOpen(true)}
              showMobileFilters={isMobile}
            />

            <div className="flex gap-6">
              {/* Desktop Filters Sidebar */}
              {!isMobile && (
                <div className="w-64 flex-shrink-0">
                  <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                    <ProductFilters
                      selectedCategories={filters.selectedCategories}
                      selectedSubcategories={filters.selectedSubcategories}
                      selectedBrands={filters.selectedBrands}
                      selectedRatings={filters.selectedRatings}
                      priceRange={filters.priceRange}
                      onToggleCategory={filters.toggleCategory}
                      onToggleSubcategory={filters.toggleSubcategory}
                      onToggleBrand={filters.toggleBrand}
                      onToggleRating={filters.toggleRating}
                      onPriceChange={filters.setPriceRange}
                      onResetFilters={filters.resetFilters}
                      categories={categoryData}
                      subcategories={subcategoryData}
                    />
                  </div>
                </div>
              )}

              {/* Mobile filters modal */}
              <MobileFiltersModal
                isOpen={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
                openSections={openFilterSections}
                onToggleSection={toggleFilterSection}
                selectedCategories={filters.selectedCategories}
                selectedSubcategories={filters.selectedSubcategories}
                selectedBrands={filters.selectedBrands}
                selectedRatings={filters.selectedRatings}
                priceRange={filters.priceRange}
                onToggleCategory={filters.toggleCategory}
                onToggleSubcategory={filters.toggleSubcategory}
                onToggleBrand={filters.toggleBrand}
                onToggleRating={filters.toggleRating}
                onPriceChange={filters.setPriceRange}
                onResetFilters={filters.resetFilters}
                categories={categoryData}
                subcategories={subcategoryData}
              />

              {/* Products Grid */}
              <div className="flex-1">
                <ProductGrid 
                  products={visibleProducts} 
                  loading={isLoading}
                />

                {/* Desktop Show More Button */}
                {!isMobile && hasMoreProducts && !isLoading && (
                  <div className="flex justify-center py-4">
                    <button 
                      onClick={handleShowMore}
                      disabled={isLoadingMore}
                      className='flex items-center justify-center text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors duration-200 mx-auto px-6 py-3 bg-white shadow-sm hover:shadow-md border border-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isLoadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Show More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Mobile Loading Indicator */}
                {isMobile && isLoadingMore && (
                  <div className="flex justify-center py-4">
                    <div className="flex items-center text-gray-600">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more products...
                    </div>
                  </div>
                )}
                
                {/* End of products message */}
                {!hasMoreProducts && products && products.length > 0 && !isLoading && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    {isMobile ? "You've reached the end of products" : "All products displayed"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        {!mobileFiltersOpen && <MobileNav/>}
      </div>
    </>
  );
};

export default OptimizedProductsPage;