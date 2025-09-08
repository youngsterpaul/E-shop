
import { useMemo } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import ProductCard from './ProductCard';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  discount?: number;
  category: string;
  inStock: boolean;
}

interface VirtualizedProductGridProps {
  products: Product[];
  loading?: boolean;
}

const VirtualizedProductGrid = ({ products, loading }: VirtualizedProductGridProps) => {
  const isMobile = isMobileUserAgent();
  
  const { columnCount, columnWidth, rowHeight } = useMemo(() => {
    if (isMobile) {
      return {
        columnCount: 2,
        columnWidth: window.innerWidth / 2 - 24, // Account for padding
        rowHeight: 280
      };
    }
    
    const containerWidth = Math.min(window.innerWidth - 48, 1200); // Max container width
    const minCardWidth = 250;
    const cols = Math.floor(containerWidth / minCardWidth);
    
    return {
      columnCount: Math.max(2, Math.min(cols, 4)),
      columnWidth: containerWidth / Math.max(2, Math.min(cols, 4)),
      rowHeight: 320
    };
  }, [isMobile]);

  const rowCount = Math.ceil(products.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const productIndex = rowIndex * columnCount + columnIndex;
    const product = products[productIndex];

    if (!product) return null;

    return (
      <div style={{ ...style, padding: '8px' }}>
        <ProductCard product={product} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array(8).fill(null).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 aspect-square rounded-lg mb-2" />
            <div className="bg-gray-200 h-4 rounded mb-1" />
            <div className="bg-gray-200 h-4 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // For small lists, use regular grid to avoid complexity
  if (products.length < 20) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={columnWidth}
      height={Math.min(800, rowCount * rowHeight)} // Limit max height
      rowCount={rowCount}
      rowHeight={rowHeight}
      width="100%"
    >
      {Cell}
    </Grid>
  );
};

export default VirtualizedProductGrid;
