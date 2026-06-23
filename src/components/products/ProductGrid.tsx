import ProductCard from '@/components/ProductCard';
import ProductSkeleton from './ProductSkeleton';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
  reviews_count?: number;
}

interface GemFashionStyleProps {
  products: Product[];
  loading: boolean;
}

const GemFashionStyle = ({ products, loading }: GemFashionStyleProps) => {
  const isMobile = isMobileUserAgent();  
  const gridCols = isMobile
    ? "grid-cols-2 gap-4" 
    : "grid-cols-5 gap-6";
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 p-6 bg-zinc-50/50 rounded-xl">
        {Array(10)
          .fill(null)
          .map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-zinc-50/50 rounded-xl border border-dashed border-zinc-200">
        <h3 className="text-xl font-serif font-medium text-zinc-900 tracking-wide mb-2">
          The Collection is Empty
        </h3>
        <p className="text-sm text-zinc-400 max-w-xs mx-auto font-light">
          We couldn't find any items matching your selection. Try adjusting your filters or search terms.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50/30 p-6 rounded-2xl border border-zinc-100/80 shadow-sm transition-all duration-300">
      <div className={`grid ${gridCols}`}>
        {products.map(product => {
          const productCardData = {
            id: product.id,
            name: product.name,
            price: product.price,
            originalPrice: product.originalPrice,
            image: product.image,
            rating: product.rating || 4,
            reviews_count: product.reviews_count || 0,
            discount: undefined,
            category: product.category,
            inStock: true,
          };
          return (
            <div 
              key={product.id} 
              className="group transition-transform duration-300 hover:-translate-y-1"
            >
              <ProductCard product={productCardData} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GemFashionStyle;