
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/products/ProductSkeleton';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const EmptyCart = () => {
  const { data: products, isLoading } = useFeaturedProducts();
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6";

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${!isMobile ? 'min-w-max' : ''}`}>
      <div className={`w-full ${!isMobile ? 'container xl:px-24 px-4 py-12' : 'px-0 pb-12'} mx-auto`}>
        {/* Empty Cart Section */}
        <div className="text-center mb-16 bg-white p-8">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-orange-100 to-pink-100 rounded-full flex items-center justify-center relative overflow-hidden">
              <ShoppingCart size={48} className="text-orange-500 z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-200/50 to-pink-200/50 animate-pulse"></div>
            </div>
            <div className="absolute top-4 right-1/2 transform translate-x-8">
              <Sparkles className="text-yellow-400 animate-bounce" size={20} />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h1>
        </div>
        {/* Featured Products Section */}
      <div className={`mx-auto bg-white ${!isMobile ? 'p-8':''}`}>
          <h2 className={`text-2xl font-bold text-gray-900 mx-2 my-4 ${isMobile ? 'p-2 border-b':''}`}>You might also like</h2>
          {isLoading ? (
            <div className={`grid ${gridCols} bg-white gap-2 p-2 shadow-sm`}>
              {Array(4).fill(null).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className={`grid ${gridCols} bg-white gap-2 p-2 shadow-sm`}>
              {products?.products?.slice(0, 12).map((product) => {
                const productCardData = {
                  id: product.product_id,
                  name: product.name,
                  price: product.price,
                  originalPrice: undefined, // Database doesn't have original_price
                  image: product.image_urls?.[0] || '/placeholder.svg',
                  rating: product.rating || 4,
                  reviews: 0, // Set to 0 since review_count doesn't exist in Product type
                  discount: undefined,
                  category: product.categories || 'General',
                  inStock: (product.stock || 0) > 0,
                };
                return <ProductCard key={product.product_id} product={productCardData} />;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;
