
import { useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import ProductSort from '@/components/products/ProductSort';
import MobileFilterSheet from '@/components/search/MobileFilterSheet';
import SearchFilters, { FilterState } from '@/components/search/SearchFilters';
import SmartPagination from '@/components/ui/pagination';
import { useProductFiltering } from '@/hooks/useProductFiltering';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface Product {
  product_id: string;
  name: string;
  price: number;
  image_urls?: string[];
  rating?: number;
  reviews_count?: number;
  categories?: string;
}

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
}: ProductListProps) => {
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile ? 'grid-cols-2' : 'grid-cols-4';

  // Apply filters
  const filteredProducts = useProductFiltering(products, filters);

  // Apply search if provided
  const searchedProducts = useMemo(() => {
    if (!searchQuery) return filteredProducts;
    return filteredProducts.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [filteredProducts, searchQuery]);

  // Sort products
  const sortedProducts = useMemo(() => {
    if (!searchedProducts?.length) return [];
    
    const productsWithRating = searchedProducts.map((p) => ({
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
  }, [searchedProducts, sortOption]);

  const activeFiltersCount = useMemo(() =>
    Object.values(filters.specifications).flat().length +
    filters.ratings.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000 ? 1 : 0),
    [filters]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-8 w-8 border-2 border-green-500 border-t-transparent rounded-full"></div>
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
      <div className="text-center py-16 bg-white rounded-lg">
        <p className="text-gray-600 text-lg">{emptyStateMessage}</p>
        {emptyStateAction}
      </div>
    );
  }

  return (
    <div className={`flex gap-6 ${isMobile ? 'flex-col' : ''}`}>
      {/* Desktop Filters */}
      {!isMobile && products.length > 0 && (
        <div className="w-72 flex-shrink-0">
          <SearchFilters products={products} onFiltersChange={onFiltersChange} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Products Header */}
        <div className={`bg-white ${!isMobile ? 'flex justify-between p-4 mb-2' : 'my-4 px-2 py-2 bg-white'}`}>
          <p className={`text-gray-600 text-lg ${!isMobile ? '' : 'hidden'}`}>
            <span className="font-semibold text-gray-900">{sortedProducts.length}</span> product
            {sortedProducts.length !== 1 && 's'} found
          </p>
          <div className="flex justify-between items-center gap-4">
            <ProductSort sortOption={sortOption} onSortChange={onSortChange} />
            {isMobile && (
              <MobileFilterSheet
                products={products}
                onFiltersChange={onFiltersChange}
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
                rating: p.rating || 4.5,
                reviews_count: p.reviews_count || 0,
                category: p.categories || '',
                inStock: true,
              }}
            />
          ))}
        </div>

        {/* Pagination */}
        {!isMobile && totalPages && totalPages > 1 && onPageChange && onPageSizeChange && (
          <SmartPagination
            currentPage={currentPage!}
            totalPages={totalPages}
            totalItems={totalCount!}
            itemsPerPage={itemsPerPage!}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[12, 24, 48, 96]}
            className="bg-white p-4 mt-2"
          />
        )}
      </div>
    </div>
  );
};