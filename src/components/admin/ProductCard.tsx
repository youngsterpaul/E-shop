
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';

interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  store: string;
  categories: string;
  featured: boolean;
  image_urls: string[];
  created_at: string;
}

interface ProductCardProps {
  product: Product;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {product.image_urls && product.image_urls.length > 0 && (
              <img
                src={product.image_urls[0]}
                alt={product.name}
                className="w-16 h-16 object-cover rounded-md"
              />
            )}
            <div>
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-muted-foreground text-sm mb-2">
                {product.description?.substring(0, 100)}...
              </p>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Price: KSh {product.price?.toLocaleString()}</span>
                <span>Stock: {product.stock}</span>
                <span>Store: {product.store}</span>
                <span>Category: {product.categories}</span>
                {product.featured && (
                  <span className="text-green-600 font-medium">Featured</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product.product_id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(product.product_id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
