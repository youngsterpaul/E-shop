import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductSearch, useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { FilterState } from '@/components/search/SearchFilters';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductList } from '@/components/products/ProductList';
import { useUrlSync } from '@/hooks/useUrlSync';
import SiteBreadcrumb from '@/components/Breadcrumb';
import { DEFAULT_SPEC_CONFIG } from '@/utils/specConfig';

const SearchPage = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(36);
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 200000],
    specifications: {},
    ratings: [],
  });

  const { searchProducts } = useProducts();

  useUrlSync(
    { searchQuery, sortOption, currentPage, itemsPerPage },
    { setSearchQuery, setSortOption, setCurrentPage, setItemsPerPage }
  );

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

  const isLoading = isMobile ? mobileQuery.isLoading : desktopQuery.isLoading;
  const isError = isMobile ? mobileQuery.isError : desktopQuery.isError;

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
  const handleFiltersChange = useCallback((newFilters: FilterState) => setFilters(newFilters), []);
  const handleBack = useCallback(() => navigate(-1), [navigate]);

  useEffect(() => {
    setFilters({ priceRange: [0, 200000], specifications: {}, ratings: [] });
  }, [searchQuery]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: searchQuery ? `Search: "${searchQuery}"` : 'Search' },
  ];

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <PageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onBack={handleBack}
        placeholder="Search for products..."
      />

      <main className={`bg-white ${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 pb-8 pt-6' : 'px-0 pb-24'}`}>
        {!isMobile && <SiteBreadcrumb items={breadcrumbItems} className="mb-6" />}
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
          specConfig={DEFAULT_SPEC_CONFIG}
        />

        {isMobile && mobileQuery.isFetchingNextPage && (
          <div className="grid grid-cols-2 gap-3 mt-4 px-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col bg-card rounded-xl shadow-sm overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
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