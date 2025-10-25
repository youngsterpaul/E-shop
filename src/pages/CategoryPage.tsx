import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import SmartPagination from '@/components/ui/pagination';
import { ChevronLeft, ChevronRight, Home, Search } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import ProductSort from '@/components/products/ProductSort';
import SearchFilters, { FilterState } from '@/components/search/SearchFilters';
import MobileFilterSheet from '@/components/search/MobileFilterSheet';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import EnhancedSearchInput from '@/components/search/EnhancedSearchInput';

interface Category {
  id: number;
  category: string;
  slug: string;
  parent_id: number | null;
}

const CategoryPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const isMobile = isMobileUserAgent();
  const [Query, setSearchQuery] = useState('');

  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    specifications: {},
    ratings: [],
  });

  const [categoryData, setCategoryData] = useState<Category | null>(null);
  const [parentCategoryData, setParentCategoryData] = useState<Category | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!isMobile) setCurrentPage(1);
  };

  // Extract URL parameters
  const searchParams = new URLSearchParams(location.search);
  const categoryId = searchParams.get('id');
  const parentId = searchParams.get('parent');
  const source = searchParams.get('source');

  // Fallback names parsed from URL for robust fetching when ID mapping fails
  const sourceParts = useMemo(
    () => (source ? source.split('|').slice(1).map((p) => decodeURIComponent(p)) : []),
    [source]
  );
  const fallbackCategoryName = sourceParts[sourceParts.length - 1];
  const fallbackParentName = sourceParts.length > 1 && sourceParts[0] !== 'allCategory' ? sourceParts[0] : undefined;

  const { fetchProductsByCategoryId } = useProducts();
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-4';

  // Fetch category data
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!categoryId) return;

      try {
        // Fetch current category
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', Number(categoryId))
          .single();

        if (categoryError) throw categoryError;
        setCategoryData(category);

        // Fetch parent category if exists
        if (parentId) {
          const { data: parentCategory, error: parentError } = await supabase
            .from('categories')
            .select('*')
            .eq('id', Number(parentId))
            .single();

          if (!parentError) {
            setParentCategoryData(parentCategory);
          }
        }

        // Parse breadcrumbs from source parameter
        if (source) {
          const parts = source.split('|');
          setBreadcrumbs(parts.slice(1)); // Remove 'category' prefix
        }
      } catch (error) {
        console.error('Error fetching category:', error);
      }
    };

    fetchCategoryData();
  }, [categoryId, parentId, source]);

  // Data Fetch - Use category ID directly for better accuracy
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ['categoryProducts', categoryId, fallbackCategoryName, currentPage, itemsPerPage],
    queryFn: () =>
      fetchProductsByCategoryId(Number(categoryId), {
        pageParam: currentPage - 1,
        pageSize: itemsPerPage,
      }, {
        categoryName: fallbackCategoryName,
        parentName: fallbackParentName,
      }),
    enabled: !!categoryId || !!fallbackCategoryName,
    staleTime: 30000,
  });

  const allProducts = useMemo(() => {
    return productsData?.products || [];
  }, [productsData]);

  const filteredProducts = useProductFiltering(allProducts, filters);

  // Sorting
  const sortedProducts = useMemo(() => {
    if (!filteredProducts) return [];
    const productsWithRating = filteredProducts.map((p) => ({
      ...p,
      calculatedRating: p.rating || 4.5,
      calculatedPrice: p.price,
    }));

    switch (sortOption) {
      case 'price-low-high':
        return [...productsWithRating].sort(
          (a, b) => a.calculatedPrice - b.calculatedPrice
        );
      case 'price-high-low':
        return [...productsWithRating].sort(
          (a, b) => b.calculatedPrice - a.calculatedPrice
        );
      case 'rating':
        return [...productsWithRating].sort(
          (a, b) => b.calculatedRating - a.calculatedRating
        );
      case 'newest':
        return [...productsWithRating].sort((a, b) =>
          b.product_id.localeCompare(a.product_id)
        );
      default:
        return productsWithRating;
    }
  }, [filteredProducts, sortOption]);

  const totalCount = productsData?.totalCount || sortedProducts.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // UI Handlers
  const handleSortChange = (val: string) => setSortOption(val);
  const handlePageChange = (p: number) => setCurrentPage(p);
  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => setFilters(newFilters);

  const activeFiltersCount =
    Object.values(filters.specifications).flat().length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? 1 : 0);

  const handleBack = () => navigate(-1);

  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      navigate('/');
    } else if (index === 1 && parentCategoryData) {
      // Navigate to parent category
      const url = `/category/${parentCategoryData.slug}?id=${parentCategoryData.id}&form=category&source=category|allCategory|${encodeURIComponent(parentCategoryData.category)}`;
      navigate(url);
    }
  };

  // Render
  return (
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <div className="fixed top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 w-full">
          <div className="flex w-full items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <EnhancedSearchInput
              value={Query}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search for products..."
              className="w-full"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSearch(Query)}
              className="h-8 px-3"
            >
              <Search className="text-gray-800 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className={`flex-grow mx-auto container ${!isMobile ? 'xl:px-24 px-4 pb-8 mt-8' : 'px-0 py-8'}`}>
        {/* Breadcrumbs */}
        {!isMobile && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6 bg-white p-4 rounded-lg shadow-sm">
            <button
              onClick={() => handleBreadcrumbClick(0)}
              className="hover:text-orange-600 transition-colors flex items-center"
            >
              <Home className="h-4 w-4" />
            </button>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <button
                  onClick={() => handleBreadcrumbClick(index + 1)}
                  className={`hover:text-orange-600 transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'font-semibold text-gray-900'
                      : ''
                  }`}
                >
                  {crumb}
                </button>
              </div>
            ))}
          </nav>
        )}

        {/* Category Title */}
        {!isMobile && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {categoryData?.category || 'Loading...'}
            </h1>
            {parentCategoryData && (
              <p className="text-gray-600 mt-2">
                in {parentCategoryData.category}
              </p>
            )}
          </div>
        )}

        <div className={`flex gap-6 ${isMobile ? 'flex-col' : ''}`}>
          {/* Desktop Filters */}
          {!isMobile && allProducts.length > 0 && (
            <div className="w-72 flex-shrink-0">
              <SearchFilters products={allProducts} onFiltersChange={handleFiltersChange} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Loading products...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-16">
                <p className="text-red-600">Error loading products. Try again.</p>
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                {/* Products Header */}
                <div className={`bg-white ${!isMobile ? 'flex justify-between p-4 mb-2' : 'mt-14 mb-4 px-2 py-2 bg-white'}`}>
                  <p className={`text-gray-600 text-lg ${!isMobile ? '' : 'hidden'}`}>
                    <span className="font-semibold text-gray-900">{sortedProducts.length}</span> product
                    {sortedProducts.length !== 1 && 's'} found
                  </p>
                  <div className="flex justify-between items-center gap-4">
                    <ProductSort sortOption={sortOption} onSortChange={handleSortChange} />
                    {isMobile && (
                      <MobileFilterSheet
                        products={allProducts}
                        onFiltersChange={handleFiltersChange}
                        activeFiltersCount={activeFiltersCount}
                      />
                    )}
                  </div>
                </div>

                {/* Products Grid */}
                <div className={`${isMobile ? 'px-2' : 'bg-white p-6 shadow-sm'} grid ${gridCols} gap-4`}>
                  {sortedProducts.map((p) => (
                    <ProductCard
                      key={p.product_id}
                      product={{
                        id: p.product_id,
                        name: p.name,
                        price: p.price,
                        originalPrice: p.price * 1.2,
                        image: p.image_urls?.[0] || '',
                        rating: 4.5,
                        reviews: 0,
                        category: p.categories || '',
                        inStock: true,
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {!isMobile && totalPages > 1 && (
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[12, 24, 48, 96]}
                    className="bg-white p-4 mt-2"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">No products found in this category.</p>
                <Button
                  onClick={() => navigate('/')}
                  className="mt-4"
                  variant="outline"
                >
                  Browse All Categories
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      {!isMobile && <Footer />}
    </div>
  );
};

export default CategoryPage;