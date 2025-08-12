import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { useProductSearch } from '@/hooks/useProducts';
import EnhancedSearchInput from '@/components/search/EnhancedSearchInput';
import Header from '@/components/Header';
import SmartPagination from '@/components/ui/pagination';
import { ArrowLeft, ChevronLeft, Search, Settings } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import ProductSort from '@/components/products/ProductSort';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  
  const { data: products, isLoading, isError } = useProductSearch(searchQuery);
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6";

  // Sort products based on selected option
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    
    const productsWithRating = products.map(product => ({
      ...product,
      calculatedRating: 4.5, // You can replace this with actual rating logic
      calculatedPrice: product.price
    }));

    switch (sortOption) {
      case 'price-low-high':
        return [...productsWithRating].sort((a, b) => a.calculatedPrice - b.calculatedPrice);
      case 'price-high-low':
        return [...productsWithRating].sort((a, b) => b.calculatedPrice - a.calculatedPrice);
      case 'rating':
        return [...productsWithRating].sort((a, b) => b.calculatedRating - a.calculatedRating);
      case 'newest':
        return [...productsWithRating].sort((a, b) => {
          return b.product_id.localeCompare(a.product_id);
        });
      case 'featured':
      default:
        return productsWithRating;
    }
  }, [products, sortOption]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Reset to first page when search query or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption]);
 
  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = () => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ 
      top: isMobile ? 120 : 200, 
      behavior: 'smooth' 
    });
  };

  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1); // Reset to first page
  };

  useEffect(() => {
    // Extract search query from URL
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    const sortParam = params.get('sort');
    const pageParam = params.get('page');
    const sizeParam = params.get('size');
    
    if (queryParam) {
      setSearchQuery(queryParam);
    }
    if (sortParam) {
      setSortOption(sortParam);
    }
    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1);
    }
    if (sizeParam) {
      setItemsPerPage(parseInt(sizeParam) || 24);
    }
  }, [location.search]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
    
    // Update URL with search query, sort option, and pagination
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    if (sortOption !== 'featured') {
      params.set('sort', sortOption);
    }
    if (itemsPerPage !== 24) {
      params.set('size', itemsPerPage.toString());
    }
    
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  // Update URL when pagination changes
  useEffect(() => {
    if (searchQuery) {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (sortOption !== 'featured') {
        params.set('sort', sortOption);
      }
      if (currentPage > 1) {
        params.set('page', currentPage.toString());
      }
      if (itemsPerPage !== 24) {
        params.set('size', itemsPerPage.toString());
      }
      
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    }
  }, [searchQuery, sortOption, currentPage, itemsPerPage]);

  return (
    <main className={`w-full min-h-screen flex flex-col bg-gray-50 flex-grow ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      <div className="mb-8 pb-8">       
        {isMobile && (
        <div className="fixed top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex w-full items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-8 w-8"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <EnhancedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search for products, brands, or categories..."
              className="w-full"
            />
            <Button
              type="button"
              onClick={() => handleSubmit()}
              className="h-8 bg-gray-50 hover:bg-gray-100 px-3"
              aria-label="Search"
            >
              <Search className="text-gray-800 h-4 w-4" />
            </Button>
            </div>
        </div>
        )}
      </div>

      {/* Search Results */}
      <div className={`w-full px-0 lg:px-16 mx-auto`}>
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
              <span className="ml-3 text-gray-600">Searching products...</span>
            </div>
            
            <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-3" />
                  <div className="bg-gray-200 h-4 rounded mb-2" />
                  <div className="bg-gray-200 h-4 rounded w-2/3" />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Search Error</h3>
              <p className="text-red-600 mb-4">
                Unable to search products at the moment. Please try again later.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry Search
              </button>
            </div>
          </div>
        ) : sortedProducts && sortedProducts.length > 0 ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-gray-600 text-lg">
                <span className="font-semibold text-gray-900">{sortedProducts.length}</span> 
                {' '}product{sortedProducts.length !== 1 ? 's' : ''} found
                {searchQuery && (
                  <span> for "<span className="font-medium text-orange-600">{searchQuery.split('(')[0].trim()}</span>"</span>
                )}
              </p>
              
              <ProductSort 
                sortOption={sortOption} 
                onSortChange={handleSortChange}
                className="w-48"
              />
            </div>
            
            <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
              {paginatedProducts.map((product) => {
                const productData = {
                  id: product.product_id,
                  name: product.name,
                  price: product.price,
                  originalPrice: product.price * 1.2, // Example discount calculation
                  image: product.image_urls?.[0] || '',
                  rating: 4.5,
                  reviews: 0,
                  discount: undefined,
                  category: product.categories || '',
                  inStock: true,
                };
                
                return (
                  <ProductCard
                    key={product.product_id}
                    product={productData}
                  />
                );
              })}
            </div>

            {/* Smart Pagination */}
            {totalPages > 1 && (
              <SmartPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                showQuickJumper={!isMobile}
                showSizeChanger={!isMobile}
                pageSizeOptions={isMobile ? [12, 24, 48] : [12, 24, 48, 96]}
                className="border-t border-gray-200 bg-white px-4 sm:px-6"
              />
            )}
          </div>
        ) : searchQuery ? (
          <div className={`text-center py-1 ${!isMobile ? 'px-80' : ''}`}>
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching "<span className="font-medium">{searchQuery}</span>"
              </p>
              <div className="space-y-3 text-sm text-gray-500">
                <p>Try:</p>
                <ul className="space-y-1">
                  <li>• Using different keywords</li>
                  <li>• Checking your spelling</li>
                  <li>• Using more general terms</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start your search</h3>
              <p className="text-gray-600">
                Enter a product name, brand, or category to find what you're looking for
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchPage;