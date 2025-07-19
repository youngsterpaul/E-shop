
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from '@/components/ProductCard';
import { useOptimizedRelatedProducts } from '@/hooks/useOptimizedRelatedProducts';
import { Skeleton } from '@/components/ui/skeleton';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface RelatedProductsCarouselProps {
  currentProduct: {
    id: string;
    category: string;
  };
}

const RelatedProductsCarousel = ({ currentProduct }: RelatedProductsCarouselProps) => {
  const { data: products = [], isLoading: loading } = useOptimizedRelatedProducts(
    currentProduct.category, 
    currentProduct.id
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = isMobileUserAgent();
  const gridCols = isMobile 
    ? "grid-cols-2" 
    : "grid-cols-6";

  const itemsPerView = {
    mobile: 2,
    tablet: 6,
    desktop: 6
  };

  const maxIndex = Math.max(0, products.length - itemsPerView.desktop);

  const nextSlide = () => {
    setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  if (loading) {
    return (
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">You might also like</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="rounded-full"
            aria-label="Previous products"
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="rounded-full"
            aria-label="Next products"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

        <div className={`grid ${gridCols} bg-white gap-1 shadow-sm`}>
          {products.slice(0, 6).map((product) => {
            const productCardData = {
                  id: product.product_id,
                  name: product.name,
                  price: product.price || 0,
                  originalPrice: undefined, // or map if available
                  image: product.image_urls?.[0] || '',
                  rating: product.rating || 4,
                  reviews: 0, // you can set default or map if available
                  discount: undefined, // map if available
                  category: product.categories || '',
                  inStock: true,
                };
                return <ProductCard key={product.product_id} product={productCardData} />;
              })}
              
        {products.length > 6 && (
          <div className="text-center mt-6">
            <Button variant="outline" className="w-full">
              View All Related Products
            </Button>
          </div>
        )}
      </div>

      {/* Dots Indicator */}
      {products.length > itemsPerView.desktop && (
        <div className="hidden md:flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                currentIndex === index ? 'bg-primary' : 'bg-gray-300'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RelatedProductsCarousel;
