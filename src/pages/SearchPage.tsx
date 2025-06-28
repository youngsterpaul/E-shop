
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '@/components/ProductCard';
import { useProductSearch } from '@/hooks/useProducts';
import EnhancedSearchInput from '@/components/search/EnhancedSearchInput';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Settings } from 'lucide-react';
import useIsMobile from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

const SearchPage = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: products, isLoading, isError } = useProductSearch(searchQuery);
  const isMobile = useIsMobile;

  useEffect(() => {
    // Extract search query from URL
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Update URL with search query
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title={'Search Products'}
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <main className="flex-grow container py-8 px-4 mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Products</h1>
          
          <div className="max-w-2xl mx-auto">
            <EnhancedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              placeholder="Search for products, brands, or categories..."
              className="w-full"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">Searching products...</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
          ) : products && products.length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 text-lg">
                  <span className="font-semibold text-gray-900">{products.length}</span> 
                  {' '}product{products.length !== 1 ? 's' : ''} found
                  {searchQuery && (
                    <span> for "<span className="font-medium text-orange-600">{searchQuery}</span>"</span>
                  )}
                </p>
                
                {/* Future filter options can go here */}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
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
            </div>
          ) : searchQuery ? (
            <div className="text-center py-16">
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
    </div>
  );
};

export default SearchPage;
