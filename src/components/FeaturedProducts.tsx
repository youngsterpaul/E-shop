/**
 * FeaturedProducts Component
 * Now uses centralized product queries for cache sharing
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import ProductCard from './ProductCard';
import { useFeaturedProducts } from '@/hooks/useProducts';
import FeaturedProductsSkeleton from './skeletons/FeaturedProductsSkeleton';

const FeaturedProducts = () => {
  // Use centralized hook with limit of 8 for this component
  const { data, isLoading } = useFeaturedProducts(8);
  
  // Transform products for ProductCard
  const products = useMemo(() => {
    if (!data?.products) return [];
    
    return data.products.slice(0, 8).map(product => ({
      id: product.product_id,
      name: product.name,
      price: product.price || 0,
      originalPrice: undefined,
      image: product.image_urls?.[0] || '',
      rating: product.rating || 4,
      reviews: 0,
      discount: undefined,
      category: product.categories || '',
      inStock: true,
    }));
  }, [data?.products]);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Deals</h2>
          <Link to="/products">
            <Button variant="outline">View All Deals</Button>
          </Link>
        </div>
        
        {isLoading ? (
          <FeaturedProductsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
