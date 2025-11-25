
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { FilterState } from '@/components/search/SearchFilters';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductList } from '@/components/products/ProductList';
import { useUrlSync } from '@/hooks/useUrlSync';

const SearchPage = () => {
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

  // Sync state with URL
  useUrlSync(
    { searchQuery, sortOption, currentPage, itemsPerPage },
    { setSearchQuery, setSortOption, setCurrentPage, setItemsPerPage }
  );

  // Data Fetch
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

  const totalCount = useMemo(() => {
    return isMobile
      ? mobileQuery.data?.totalCount || allProducts.length
      : desktopQuery.data?.totalCount || allProducts.length;
  }, [isMobile, mobileQuery.data, desktopQuery.data, allProducts.length]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Infinite Scroll (mobile)
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

  // UI Handlers
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

  const handleBack = useCallback(() => navigate(-1), [navigate]);

  // Reset filters when search query changes
  useEffect(() => {
    setFilters({
      priceRange: [0, 200000],
      specifications: {},
      ratings: [],
    });
  }, [searchQuery]);

  return (
    <div className={`${!isMobile ? 'min-w-max' : ''}`}>
      <PageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onBack={handleBack}
        placeholder="Search for products..."
      />

      <main className={`flex-grow mx-auto container ${!isMobile ? 'px-4 xl:px-24 pb-8 mt-8' : 'px-0'}`}>
        <ProductList
          products={allProducts}
          isLoading={isLoading}
          isError={isError}
          sortOption={sortOption}
          onSortChange={handleSortChange}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          emptyStateMessage="No products found."
        />

        {/* Mobile Loading Indicator */}
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
      </main>
    </div>
  );
};

export default SearchPage;