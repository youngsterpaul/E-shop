import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import EnhancedSearchInput from '@/components/search/EnhancedSearchInput';
import SmartPagination from '@/components/ui/pagination';
import { ChevronLeft, Search } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import ProductSort from '@/components/products/ProductSort';
import SearchFilters, { FilterState } from '@/components/search/SearchFilters';
import MobileFilterSheet from '@/components/search/MobileFilterSheet';
import { useProductFiltering } from '@/hooks/useProductFiltering';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    specifications: {},
    ratings: [],
  });

  const { searchProducts } = useProducts();
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-4';

  // ----- Data Fetch -----
  const desktopQuery = useQuery({
    queryKey: ['productSearch', searchQuery, currentPage, itemsPerPage],
    queryFn: () =>
      searchProducts(searchQuery, {
        pageParam: currentPage - 1,
        pageSize: itemsPerPage,
      }),
    enabled: !isMobile && searchQuery.length > 1,
    staleTime: 30000,
  });

  const mobileQuery = useProductSearch(searchQuery, isMobile ? 12 : undefined);

  const queryData = isMobile ? mobileQuery : desktopQuery;
  const isLoading = queryData.isLoading;
  const isError = queryData.isError;

  const allProducts = useMemo(() => {
    return isMobile
      ? mobileQuery.data?.products || []
      : desktopQuery.data?.products || [];
  }, [isMobile, mobileQuery.data, desktopQuery.data]);

  const filteredProducts = useProductFiltering(allProducts, filters);

  // ----- Sorting -----
  const sortedProducts = useMemo(() => {
    if (!filteredProducts?.length) return [];
    
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

  const totalCount = useMemo(() => {
    return isMobile
      ? mobileQuery.data?.totalCount || sortedProducts.length
      : desktopQuery.data?.totalCount || sortedProducts.length;
  }, [isMobile, mobileQuery.data, desktopQuery.data, sortedProducts.length]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // ----- Infinite Scroll (mobile) -----
  const handleLoadMore = useCallback(() => {
    if (isMobile && mobileQuery.hasNextPage && !mobileQuery.isFetchingNextPage) {
      mobileQuery.fetchNextPage();
    }
  }, [isMobile, mobileQuery]);

  useEffect(() => {
    if (!isMobile) return;
    
    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 500
      ) {
        handleLoadMore();
      }
    };
    
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, handleLoadMore]);

  // ----- Sync URL -----
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const s = params.get('sort');
    const p = params.get('page');
    const size = params.get('size');

    if (q) setSearchQuery(q);
    if (s) setSortOption(s);
    if (p && !isMobile) setCurrentPage(parseInt(p));
    if (size && !isMobile) setItemsPerPage(parseInt(size));
  }, [location.search, isMobile]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (sortOption !== 'featured') params.set('sort', sortOption);
    if (!isMobile) {
      if (currentPage > 1) params.set('page', currentPage.toString());
      if (itemsPerPage !== 24) params.set('size', itemsPerPage.toString());
    }
    window.history.replaceState({}, '', `${location.pathname}?${params}`);
  }, [searchQuery, sortOption, currentPage, itemsPerPage, isMobile, location.pathname]);

  // ----- UI Handlers -----
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!isMobile) setCurrentPage(1);
  }, [isMobile]);

  const handleSortChange = useCallback((val: string) => setSortOption(val), []);
  
  const handlePageChange = useCallback((p: number) => setCurrentPage(p), []);
  
  const handlePageSizeChange = useCallback((size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  }, []);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const activeFiltersCount = useMemo(() => 
    Object.values(filters.specifications).flat().length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? 1 : 0),
    [filters]
  );

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  // ----- Render -----
  return (
    <div className={`bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
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
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search for products..."
              className="w-full"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSearch(searchQuery)}
              className="h-8 px-3"
            >
              <Search className="text-gray-800 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <main className={`flex-grow mx-auto container ${!isMobile ? 'xl:px-24 px-4 pb-8 mt-8' : 'px-0'}`}>
        <div className={`flex gap-6 ${isMobile ? 'flex-col' : ''}`}>
          {!isMobile && allProducts.length > 0 && (
            <div className="w-72 flex-shrink-0">
              <SearchFilters products={allProducts} onFiltersChange={handleFiltersChange} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Searching products...</span>
              </div>
            ) : isError ? (
              <div className="text-center py-16">
                <p className="text-red-600">Error loading products. Try again.</p>
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                <div className={`bg-white ${!isMobile ? 'flex justify-between p-4 mb-2' : 'mt-14 mb-4 px-2 py-2 bg-white'}`}>
                  <p className={`text-gray-600 text-lg ${!isMobile ? '':'hidden'}`}>
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

                {isMobile && mobileQuery.isFetchingNextPage && (
                  <div className="grid grid-cols-2 gap-2 mt-4 px-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
                      >
                        <div className="h-40 bg-gray-200 animate-pulse" />
                        <div className="p-2 space-y-2">
                          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isMobile && totalPages > 1 && (
                  <SmartPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalCount}
                    itemsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[12, 24, 48, 96]}
                    className='bg-white p-4 mt-2'
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-600">No products found.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchPage;