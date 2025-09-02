
import ProductCard from '@/components/ProductCard';
import { useProducts } from '@/hooks/useProducts';


interface RelatedProductsProps {
  currentProduct: {
    id: string;
    category: string;
  };
}

import React, { useEffect, useState } from 'react';

const RelatedProducts = ({ currentProduct }: RelatedProductsProps) => {
  const { fetchProducts } = useProducts();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts().then((result) => {
      setProducts(result.products || []);
    });
  }, [fetchProducts]);

  const relatedProducts = products
    .filter(product => 
      product.category === currentProduct.category && 
      product.id !== currentProduct.id
    )
    .slice(0, 8); // Show more related products

  if (relatedProducts.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Related Products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
        {relatedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;

