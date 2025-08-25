
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Product = {
  product_id: string;
  name: string;
  price: number;
  description?: string;
  image_urls?: string[];
  category_id?: string;
  categories?: string;
  subcategories?: string;
  stock?: number;
  featured?: boolean;
  specification?: string | Record<string, any>;
  features?: string | string[]; // Changed from Record<string, any> to string[]
  rating?: number;
};

export const useProducts = () => {
const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    if (error) {
      console.error('Error fetching products:', error);
      throw new Error(error.message);
    }

    // Parse specification if it's a string
    const processedData = data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    }));
    
    return processedData as Product[];
  };
  
  const fetchProductById = async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', id)
      .maybeSingle();
      
    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error(error.message);
    }

    // Process specification field if it exists and is a string
    if (data && data.specification && typeof data.specification === 'string') {
      try {
        data.specification = JSON.parse(data.specification);
      } catch (e) {
        console.error('Failed to parse specification JSON:', e);
        data.specification = null;
      }
    }
    
    return data as Product;
  };
  
  const fetchFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .limit(12);
      
    if (error) {
      console.error('Error fetching featured products:', error);
      throw new Error(error.message);
    }
    
    // Parse specification if it's a string
    const processedData = data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    }));
    
    return processedData as Product[];
  };
  
  const fetchProductsByCategory = async (category: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('categories', category);
      
    if (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw new Error(error.message);
    }
    
    // Parse specification if it's a string
    const processedData = data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    }));
    
    return processedData as Product[];
  };
  
  const searchProducts = async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${query}%`);
      
    if (error) {
      console.error(`Error searching products with query ${query}:`, error);
      throw new Error(error.message);
    }
    
    // Parse specification if it's a string
    const processedData = data.map(product => ({
      ...product,
      specification: typeof product.specification === 'string' && product.specification
        ? JSON.parse(product.specification)
        : product.specification || {}
    }));
    
    return processedData as Product[];
  };

  return {
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    fetchProductsByCategory,
    searchProducts
  };
};

export const useFeaturedProducts = () => {
  const { fetchFeaturedProducts } = useProducts();
  
  return useQuery({
    queryKey: ['featuredProducts'],
    queryFn: fetchFeaturedProducts
  });
};

export const useProduct = (id: string) => {
  const { fetchProductById } = useProducts();
  
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id
  });
};

export const useProductByName = (productName: string) => {
  return useQuery({
    queryKey: ["product", "name", productName],
    queryFn: () => fetchProductByName(productName),
    enabled: !!productName,
  });
};

export const useProductSearch = (query: string) => {
  const { searchProducts } = useProducts();
  
  return useQuery({
    queryKey: ['productSearch', query],
    queryFn: () => searchProducts(query),
    enabled: query.length > 1
  });
};

export const fetchProductByName = async (productName: string): Promise<Product> => {
  // Convert URL slug back to searchable format
  const searchName = productName.replace(/-/g, ' ');
  
  const { data, error } = await supabase
    .from("products")
    .select()
    .ilike("name", `%${searchName}%`)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Product;
};
