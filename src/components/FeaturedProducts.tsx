import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import ProductCard from './ProductCard';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from './ui/skeleton';
import FeaturedProductsSkeleton from './skeletons/FeaturedProductsSkeleton';

interface Product {
  product_id: string;
  name: string;
  price: number;
  image_urls: string[];
  categories: string;
  rating: number;
  is_featured?: boolean;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('featured', true)
          .limit(8);
          
        if (error) throw error;
        
        const transformedData: Product[] = data.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price || 0,
          image_urls: item.image_urls || [],
          categories: item.categories || '',
          rating: 4, // default rating
        }));
        
        setProducts(transformedData);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Featured Deals</h2>
          <Link to="/products">
            <Button variant="outline">View All Deals</Button>
          </Link>
        </div>
        
        {loading ? (
          <FeaturedProductsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
            {products.map(product => {
              const productCardData = {
                id: product.product_id,
                name: product.name,
                price: product.price,
                originalPrice: undefined, // or map if available
                image: product.image_urls?.[0] || '',
                rating: product.rating || 4,
                reviews: 0, // you can set default or map if available
                discount: undefined, // map if available
                category: product.categories,
                inStock: true,
              };
              return <ProductCard key={product.product_id} product={productCardData} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
