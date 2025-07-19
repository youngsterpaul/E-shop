
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ShoppingCart, Sparkles } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/products/ProductSkeleton';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '../ui/mobile-header';
import Header from '../Header';
import MobileNav from '../MobileNav';

const EmptyCart = () => {
  const { data: products, isLoading } = useFeaturedProducts();
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6";

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
        {isMobile && <MobileHeader 
          title="Shopping Cart"
          backTo="/products"
          rightAction={
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              <span>0</span>
            </div>
          }
        />
      } 
      <MobileNav /> 
      <div className="py-12">
        {/* Empty Cart Section */}
        <div className="text-center mb-16">
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
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
          {isLoading ? (
            <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
              {Array(4).fill(null).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
              {products?.slice(0, 4).map((product) => {
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
