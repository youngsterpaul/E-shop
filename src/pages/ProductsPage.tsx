
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useOptimizedProductsData } from '@/hooks/useOptimizedProductsData';
import ProductGrid from '@/components/products/ProductGrid';
import ProductSort from '@/components/products/ProductSort';
import SmartPagination from '@/components/ui/pagination';
import ProductFilters from '@/components/products/ProductFilters';
import SiteBreadcrumb from '@/components/Breadcrumb';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  
  // Get category and subcategory from URL
  const category = searchParams.get('category');
  const subcategory = searchParams.get('subcategory');
  
  // Initialize filters with URL parameters
  const filters = useProductFilters({
    onFiltersChange: (newFilters) => {
      // Update URL when filters change
      const params = new URLSearchParams(searchParams);
      
      // Handle category
      if (newFilters.selectedCategories.length > 0) {
        params.set('category', newFilters.selectedCategories[0]);
      } else if (!category) {
        params.delete('category');
      }
      
      // Handle other filters
      if (newFilters.selectedSubcategories.length > 0) {
        params.set('subcategory', newFilters.selectedSubcategories.join(','));
      } else {
        params.delete('subcategory');
      }
      
      if (newFilters.selectedBrands.length > 0) {
        params.set('brands', newFilters.selectedBrands.join(','));
      } else {
        params.delete('brands');
      }
      
      if (newFilters.priceRange[0] > 0 || newFilters.priceRange[1] < 100000) {
        params.set('price_min', newFilters.priceRange[0].toString());
        params.set('price_max', newFilters.priceRange[1].toString());
      } else {
        params.delete('price_min');
        params.delete('price_max');
      }
      
      if (newFilters.sortOption !== 'featured') {
        params.set('sort', newFilters.sortOption);
      } else {
        params.delete('sort');
      }
      
      navigate(`/products?${params.toString()}`, { replace: true });
    }
  });

  // Get products with filtering
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
    productsPerPage: itemsPerPage,
  });

  // Initialize filters from URL on page load
  useEffect(() => {
    if (category && !filters.selectedCategories.includes(category)) {
      filters.toggleCategory(category);
    }
    
    if (subcategory) {
      const subcats = subcategory.split(',');
      subcats.forEach(sub => {
        if (!filters.selectedSubcategories.includes(sub)) {
          filters.toggleSubcategory(sub);
        }
      });
    }
    
    const brands = searchParams.get('brands');
    if (brands) {
      const brandList = brands.split(',');
      brandList.forEach(brand => {
        if (!filters.selectedBrands.includes(brand)) {
          filters.toggleBrand(brand);
        }
      });
    }
    
    const priceMin = searchParams.get('price_min');
    const priceMax = searchParams.get('price_max');
    if (priceMin || priceMax) {
      filters.setPriceRange([
        priceMin ? parseInt(priceMin) : 0,
        priceMax ? parseInt(priceMax) : 100000
      ]);
    }
    
    const sort = searchParams.get('sort');
    if (sort && sort !== filters.sortOption) {
      filters.setSortOption(sort);
    }
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: isMobile ? 120 : 200, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const gridCols = isMobile ? "grid-cols-2" : "grid-cols-6";

  return (
    <div className={`min-h-screen ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      
      {isMobile ? (
        <MobileHeader
          title={category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Products'}
          onBack={handleBack}
          rightAction={
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Filter className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filter Products</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
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
                  />
                </div>
              </SheetContent>
            </Sheet>
          }
        />
      ) : (
        <div className="mx-0 lg:mx-16">
          <SiteBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Products', href: '/products' },
              ...(category ? [{ label: category.charAt(0).toUpperCase() + category.slice(1) }] : [])
            ]}
            className="mb-6"
          />
        </div>
      )}

      <div className="flex gap-6 mx-0 lg:mx-16">
        {/* Desktop Sidebar Filters */}
        {!isMobile && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Filter Products</h2>
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
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-4 lg:px-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}
              </h1>
              <p className="text-gray-600">
                <span className="font-semibold">{totalProducts}</span> product{totalProducts !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <ProductSort 
              sortOption={filters.sortOption} 
              onSortChange={filters.setSortOption}
              className="w-48"
            />
          </div>

          {/* Products Grid */}
          <div className="px-4 lg:px-0">
            <ProductGrid
              products={products}
              loading={isLoading}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalProducts}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showQuickJumper={!isMobile}
                showSizeChanger={!isMobile}
                pageSizeOptions={isMobile ? [12, 24, 48] : [12, 24, 48, 96]}
                className="border-t border-gray-200 bg-white px-4 sm:px-6 mt-8"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
