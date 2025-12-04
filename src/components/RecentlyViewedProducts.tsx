import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Link } from 'react-router-dom';
import { Clock, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface RecentlyViewedProductsProps {
  excludeProductId?: string;
  maxItems?: number;
}

export const RecentlyViewedProducts = ({ 
  excludeProductId, 
  maxItems = 6 
}: RecentlyViewedProductsProps) => {
  const { recentlyViewed, clearRecentlyViewed, removeFromRecentlyViewed } = useRecentlyViewed();

  // Filter out current product if provided
  const filteredProducts = recentlyViewed
    .filter(p => p.product_id !== excludeProductId)
    .slice(0, maxItems);

  if (filteredProducts.length === 0) {
    return null;
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Recently Viewed</h2>
            <p className="text-sm text-muted-foreground">Continue where you left off</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearRecentlyViewed}
          className="text-muted-foreground hover:text-foreground"
        >
          Clear all
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredProducts.map((product) => (
          <Card 
            key={product.product_id} 
            className="group relative bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromRecentlyViewed(product.product_id);
              }}
              className="absolute top-2 right-2 z-10 w-6 h-6 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="w-3 h-3" />
            </button>
            
            <Link to={`/product/${generateSlug(product.name)}/${product.product_id}`}>
              <div className="aspect-square overflow-hidden bg-muted/30">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm font-bold text-primary">
                  KSh {product.price.toLocaleString()}
                </p>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewedProducts;
