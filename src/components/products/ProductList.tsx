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
  emptyStateMessage = 'No products found.',
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full" />
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600">Error loading products. Try again.</p>
      </div>
    );
  }

  if (sortedProducts.length === 0) {
    return (
      <div className="flex gap-6">
        {/* Keep filters visible even when no results */}
        {!isMobile && products.length > 0 && (
          <div className="w-72 flex-shrink-0">
            <SearchFilters
              products={products}
              value={filters}
              onFiltersChange={onFiltersChange}
              specConfig={specConfig}
            />
          </div>
        )}
        <div className="flex-1 text-center py-16 bg-background rounded-lg">
          <p className="text-gray-600 text-lg">{emptyStateMessage}</p>
          {emptyStateAction}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-6 ${isMobile ? 'flex-col' : ''}`}>
      {/* Desktop Filters */}
      {!isMobile && products.length > 0 && (
        <div className="w-72 flex-shrink-0">
          <SearchFilters
            products={products}
            value={filters}
            onFiltersChange={onFiltersChange}
            specConfig={specConfig}
          />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Products Header — fixed on mobile */}
        <div
          className={
            !isMobile
              ? 'bg-background flex justify-between p-4 mb-2'
              : 'fixed left-0 right-0 z-30 bg-background border-b border-border px-3 py-2 shadow-sm'
          }
          style={
            isMobile
              ? { top: 'calc(56px + env(safe-area-inset-top))' }
              : undefined
          }
        >
          {!isMobile && (
            <p className="text-gray-600 text-lg">
              <span className="font-semibold text-gray-900">{displayCount}</span>{' '}
              product{displayCount !== 1 ? 's' : ''} found
              {hasActiveFilters && (
                <span className="text-sm text-gray-400 ml-2">(filtered)</span>
              )}
            </p>
          )}
          <div className="flex justify-between items-center gap-3">
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

        {/* Spacer to offset fixed mobile header */}
        {isMobile && <div aria-hidden="true" className="h-14" />}

        {/* Products Grid */}
        <div className={`${isMobile ? 'px-2' : 'bg-background p-6 shadow-sm'} grid ${gridCols} gap-4`}>
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

        {/* Pagination — hide when filters are active since we're showing filtered subset */}
        {!isMobile && !hasActiveFilters && totalPages && totalPages > 1 && (
          <SmartPagination
            currentPage={currentPage!}
            totalPages={totalPages}
            totalItems={totalCount!}
            itemsPerPage={itemsPerPage!}
            onPageChange={handlePageChange}
            className="bg-background mt-2"
          />
        )}
      </div>
    </div>
  );
};
