
import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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
import { usePagination } from "@/hooks/usePagination";

const OptimizedProductsPage = () => {
  const { categories, subcategories, fetchSubcategories, setSubcategories } = useCategories();
  const isMobile = isMobileUserAgent();
  
  // Mobile filter state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [openFilterSections, setOpenFilterSections] = useState<string[]>([
    "categories",
    "price",
  ]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  
  // Filter management
  const filters = useProductFilters({
    onFiltersChange: () => {
      setCurrentPage(1); // Reset to first page when filters change
    }
  });

  // Data fetching with optimizations
  const { products, totalProducts, totalPages, isLoading } = useOptimizedProductsData({
    filters: {
      selectedCategories: filters.selectedCategories,
      selectedSubcategories: filters.selectedSubcategories,
      selectedBrands: filters.selectedBrands,
      selectedRatings: filters.selectedRatings,
      priceRange: filters.priceRange,
      sortOption: filters.sortOption,
    },
    currentPage,
    productsPerPage,
  });

  // Update subcategories when categories change
  React.useEffect(() => {
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

  const { PaginationComponent } = usePagination({
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
  });

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

      <div className="flex flex-col min-h-screen">
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader 
            title={'Products'}
            backTo="/"
            rightAction={
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}

        <main className="flex-grow pt-6 pb-16">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            <SiteBreadcrumb 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Products' }
              ]}
              className="mb-6"
            />

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
                  products={products} 
                  loading={isLoading}
                />

                {/* Pagination */}
                {!isLoading && totalPages > 1 && (
                  <div className="mt-8">
                    <PaginationComponent />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <MobileNav/>
      </div>
    </>
  );
};

export default OptimizedProductsPage;
