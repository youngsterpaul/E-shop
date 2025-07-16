import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ProductCard from './ProductCard';

interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categories: string;
  featured: boolean;
  image_urls: string[];
  created_at: string;
}

interface ProductsListProps {
  products: Product[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
}

const ProductsList: React.FC<ProductsListProps> = ({ products, onEdit, onDelete }) => {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">No products found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProductsList;
