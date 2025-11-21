
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

interface ProductGridProps {
  products: Product[];
  loading: boolean;
}

const ProductGrid = ({ products, loading }: ProductGridProps) => {
  const isMobile = isMobileUserAgent();  
  const gridCols = isMobile
    ? "grid-cols-2" 
    : "grid-cols-5";
  
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8)
          .fill(null)
          .map((_, index) => (
            <ProductSkeleton key={index} />
          ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No products found</h3>
        <p className="text-gray-500 mb-4">
          Try changing your filters or search term
        </p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols} bg-white p-4 shadow-sm`}>
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
        return <ProductCard key={product.id} product={productCardData} />;
      })}
    </div>
  );
};

export default ProductGrid;
