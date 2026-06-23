import { useMemo, useCallback } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductSort from '@/components/products/ProductSort';
import MobileSortDropdown from '@/components/products/MobileSortDropdown';
import MobileFilterSheet from '@/components/search/MobileFilterSheet';
import SearchFilters, { FilterState } from '@/components/search/SearchFilters';
import { SpecConfig } from '@/utils/specConfig';
import SmartPagination from '@/components/ui/pagination';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Product } from '@/queries/productQueries';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  sortOption: string;
  onSortChange: (value: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  searchQuery?: string;
  emptyStateMessage?: string;
  emptyStateAction?: React.ReactNode;
  specConfig?: SpecConfig[];
}

export const ProductList = ({
  products,
  isLoading,
  isError,
  sortOption,
  onSortChange,
  filters,
  onFiltersChange,
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  searchQuery,
  emptyStateMessage = 'No high-fashion items matched your selection.',
  emptyStateAction,
  specConfig,
}: ProductListProps) => {
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-4';

  // Check if any filters are actively applied
  const hasActiveFilters = useMemo(() => {
    const hasSpecFilters = Object.values(filters.specifications).some(v => v.length > 0);
    const hasRatingFilters = filters.ratings.length > 0;
    const hasPriceFilters = filters.priceRange[0] > 0 || filters.priceRange[1] < 200000;
    return hasSpecFilters || hasRatingFilters || hasPriceFilters;
  }, [filters]);

  // Client-side filtering — only runs when filters are active
  const filteredProducts = useProductFiltering(products, filters);

  const searchedProducts = useMemo(() => {
    if (!searchQuery) return filteredProducts;
    return filteredProducts.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredProducts, searchQuery]);

  const sortedProducts = useMemo(() => {
    if (!searchedProducts?.length) return [];

    const withRating = searchedProducts.map(p => ({
      ...p,
      calculatedRating: p.rating || 4.5,
      calculatedPrice: p.price,
    }));

    switch (sortOption) {
      case 'price-low-high':
        return [...withRating].sort((a, b) => a.calculatedPrice - b.calculatedPrice);
      case 'price-high-low':
        return [...withRating].sort((a, b) => b.calculatedPrice - a.calculatedPrice);
      case 'rating':
        return [...withRating].sort((a, b) => b.calculatedRating - a.calculatedRating);
      case 'newest':
        return [...withRating].sort((a, b) => b.product_id.localeCompare(a.product_id));
      default:
        return withRating;
    }
  }, [searchedProducts, sortOption]);

  const activeFiltersCount = useMemo(() =>
    Object.values(filters.specifications).flat().length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? 1 : 0),
    [filters]
  );

  const handlePageChange = useCallback((page: number) => {
    onPageChange?.(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [onPageChange]);

  // When filters are active show the filtered count, otherwise show server total
  const displayCount = hasActiveFilters
    ? sortedProducts.length
    : (totalCount ?? searchedProducts.length);

  // Gem Fashion Luxury Loader
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-stone-50/50 rounded-xl">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute animate-spin h-10 w-10 border-2 border-amber-600 border-t-transparent rounded-full" />
          <div className="h-4 w-4 bg-stone-900 rounded-full animate-pulse" />
        </div>
        <span className="mt-4 text-xs uppercase tracking-widest text-stone-500 font-medium">
          Curating Gem Fashion Style...
        </span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 border border-red-100 bg-red-50/30 rounded-xl max-w-md mx-auto">
        <p className="text-sm font-medium tracking-wide text-red-800 uppercase">A Styling Error Occurred</p>
        <p className="text-xs text-red-600 mt-1">Unable to load the collection. Please refresh.</p>
      </div>
    );
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="flex gap-8">
        {/* Keep filters visible even when no results */}
        {!isMobile && products.length > 0 && (
          <div className="w-64 flex-shrink-0 bg-white border border-stone-100 p-5 rounded-xl shadow-sm">
            <SearchFilters
              products={products}
              value={filters}
              onFiltersChange={onFiltersChange}
              specConfig={specConfig}
            />
          </div>
        )}
        <div className="flex-1 text-center py-20 bg-stone-50 border border-stone-100 rounded-xl flex flex-col items-center justify-center px-4">
          <h3 className="font-serif text-xl text-stone-800 mb-2">Gem Fashion Style</h3>
          <p className="text-stone-500 max-w-sm text-sm tracking-wide">{emptyStateMessage}</p>
          {emptyStateAction && <div className="mt-6">{emptyStateAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-8 ${isMobile ? 'flex-col' : ''}`}>
      {/* Desktop Filters Side Panel */}
      {!isMobile && products.length > 0 && (
        <div className="w-64 flex-shrink-0 bg-white border border-stone-100 p-5 rounded-xl shadow-sm h-fit sticky top-24">
          <div className="mb-4 pb-3 border-b border-stone-100">
            <h2 className="font-serif text-lg tracking-wide text-stone-900">Gem Fashion Style</h2>
            <p className="text-[11px] uppercase tracking-widest text-amber-600 font-semibold mt-0.5">Filter Studio</p>
          </div>
          <SearchFilters
            products={products}
            value={filters}
            onFiltersChange={onFiltersChange}
            specConfig={specConfig}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Products Header — luxury styling setup */}
        <div
          className={
            !isMobile
              ? 'bg-transparent flex justify-between items-center pb-4 mb-6 border-b border-stone-200'
              : 'fixed left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 shadow-sm'
          }
          style={
            isMobile
              ? { top: 'calc(56px + env(safe-area-inset-top))' }
              : undefined
          }
        >
          {!isMobile && (
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold mb-0.5">
                Exclusive Lookbook
              </p>
              <p className="text-stone-500 text-sm tracking-wide">
                Showing <span className="font-semibold text-stone-900">{displayCount}</span> luxury architectural piece{displayCount !== 1 ? 's' : ''}
                {hasActiveFilters && (
                  <span className="text-xs text-stone-400 italic ml-2">(refined selection)</span>
                )}
              </p>
            </div>
          )}
          
          <div className="flex justify-between items-center gap-4 w-full sm:w-auto">
            {isMobile && (
              <div className="flex flex-col">
                <span className="font-serif text-xs text-stone-900 tracking-wider font-semibold">Gem Fashion Style</span>
                <span className="text-[10px] text-stone-400 font-medium">{displayCount} items available</span>
              </div>
            )}
            <div className="flex items-center gap-2 ml-auto">
              {isMobile ? (
                <MobileSortDropdown sortOption={sortOption} onSortChange={onSortChange} />
              ) : (
                <ProductSort sortOption={sortOption} onSortChange={onSortChange} />
              )}
              {isMobile && (
                <MobileFilterSheet
                  products={products}
                  filters={filters}
                  onFiltersChange={onFiltersChange}
                  activeFiltersCount={activeFiltersCount}
                />
              )}
            </div>
          </div>
        </div>

        {/* Spacer to offset fixed mobile header */}
        {isMobile && <div aria-hidden="true" className="h-16" />}

        {/* Products Grid with premium padding and seamless alignment */}
        <div className={`${isMobile ? 'px-3 py-2' : 'bg-transparent'} grid ${gridCols} gap-x-5 gap-y-8`}>
          {sortedProducts.map((p) => (
            <ProductCard
              key={p.product_id}
              product={{
                id: p.product_id,
                name: p.name,
                price: p.price,
                originalPrice: p.price * 1.2,
                image: p.image_urls?.[0] || '',
                rating: p.rating || 4.5,
                reviews_count: p.reviews_count || 0,
                category: p.categories || '',
                inStock: true,
              }}
            />
          ))}
        </div>

        {/* Pagination Panel with Premium Clean Bordering */}
        {!isMobile && !hasActiveFilters && totalPages && totalPages > 1 && (
          <div className="mt-12 pt-6 border-t border-stone-200">
            <SmartPagination
              currentPage={currentPage!}
              totalPages={totalPages}
              totalItems={totalCount!}
              itemsPerPage={itemsPerPage!}
              onPageChange={handlePageChange}
              className="bg-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
};