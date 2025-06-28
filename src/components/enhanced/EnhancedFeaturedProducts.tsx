import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import LazySection from '@/components/performance/LazySection';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const EnhancedFeaturedProducts = memo(() => {
  const { data: products, isLoading } = useFeaturedProducts();
  const isMobile = isMobileUserAgent();
  
  // Determine number of products and grid layout based on device
  const productCount = isMobile ? 2 : 6;
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6 mx-auto px-4";
  
  const loadingSkeleton = (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse" />
        </div>
        <div className={`grid ${gridCols} gap-3 md:gap-4`}>
          {Array.from({ length: productCount }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-64 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return loadingSkeleton;
  }

  return (
    <LazySection fallback={loadingSkeleton}>
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <TrendingUp size={16} />
              HOT DEALS
            </div>
          </div>

          {/* Products Grid */}
          <div className={`grid ${gridCols} gap-3 md:gap-4 mb-12`}>
            {products?.slice(0, productCount).map(product => {
              const productCardData = {
                id: product.product_id,
                name: product.name,
                price: product.price,
                originalPrice: undefined,
                image: product.image_urls?.[0] || '/placeholder.svg',
                rating: product.rating || 4,
                reviews: 0,
                discount: undefined,
                category: product.categories,
                inStock: true,
              };
              return (
                <ProductCard 
                  key={product.product_id} 
                  product={productCardData} 
                />
              );
            })}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg group"
            >
              <Link to="/products">
                View All Products
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </LazySection>
  );
});

EnhancedFeaturedProducts.displayName = 'EnhancedFeaturedProducts';

export default EnhancedFeaturedProducts;