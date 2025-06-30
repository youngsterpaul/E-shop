
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Sparkles, TrendingUp, Gift } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/ProductCard';
import ProductSkeleton from '@/components/products/ProductSkeleton';

const ModernEmptyCart = () => {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
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
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Ready to start shopping? Explore our amazing products and find something you'll love!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/products">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 px-8">
                Start Shopping
              </Button>
            </Link>
            <Link to="/categories">
              <Button variant="outline" size="lg" className="px-8">
                Browse Categories
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="text-blue-600" size={24} />
                </div>
                <h3 className="font-semibold mb-2">Trending Products</h3>
                <p className="text-sm text-gray-600">
                  Discover what's popular and trending right now
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="text-green-600" size={24} />
                </div>
                <h3 className="font-semibold mb-2">Special Offers</h3>
                <p className="text-sm text-gray-600">
                  Don't miss out on our exclusive deals and discounts
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold mb-2">New Arrivals</h3>
                <p className="text-sm text-gray-600">
                  Check out our latest products and collections
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600">
              Start with these popular items that other customers love
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Array(4).fill(null).map((_, index) => (
                <ProductSkeleton key={index} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products?.slice(0, 4).map((product) => {
                const productCardData = {
                  id: product.product_id,
                  name: product.name,
                  price: product.price,
                  originalPrice: undefined, // Database doesn't have original_price
                  image: product.image_urls?.[0] || '/placeholder.svg',
                  rating: product.rating || 4,
                  reviews: product.review_count || 0,
                  discount: undefined,
                  category: product.categories || 'General',
                  inStock: (product.stock || 0) > 0,
                };
                return <ProductCard key={product.product_id} product={productCardData} />;
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline" size="lg">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernEmptyCart;
