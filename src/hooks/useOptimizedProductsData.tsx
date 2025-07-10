
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductCardData {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  isNew?: boolean;
  isSale?: boolean;
  rating?: number;
  brand?: string;
  brandId?: string;
}

interface ProductFilters {
  selectedCategories: string[];
  selectedSubcategories: string[];
  selectedBrands: string[];
  selectedRatings: number[];
  priceRange: [number, number];
  sortOption: string;
}

interface UseOptimizedProductsDataProps {
  filters: ProductFilters;
  currentPage: number;
  productsPerPage: number;
}

export const useOptimizedProductsData = ({
  filters,
  currentPage,
  productsPerPage
}: UseOptimizedProductsDataProps) => {
  const { toast } = useToast();

  // Fetch products with caching
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<ProductCardData[]> => {
      const { data: productData, error } = await supabase
        .from('products')
        .select(`
          *,
          brands:brand_id (
            id,
            name,
            logo_url
          )
        `);
      
      if (error) throw error;
      
      return productData?.map(product => {
        const categoryParts = product.categories?.split(' > ') || [];
        const category = categoryParts[0] || 'Uncategorized';
        const subcategory = categoryParts[1] || undefined;

        return {
          id: product.product_id,
          name: product.name,
          price: product.price || 0,
          originalPrice: product.price ? product.price * 1.1 : undefined,
          image: product.image_urls ? product.image_urls[0] : '/placeholder.svg',
          category: category,
          subcategory: subcategory,
          isNew: Math.random() > 0.7,
          isSale: Math.random() > 0.7,
          rating: product.rating || Math.floor(Math.random() * 5) + 1,
          brand: product.brands?.name || 'Unknown',
          brandId: product.brand_id ?? undefined
        };
      }) || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2
  });

  // Handle errors using useEffect instead of onError
  useEffect(() => {
    if (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Apply filters and sorting with memoization
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Apply category filter
    if (filters.selectedCategories.length > 0) {
      result = result.filter(product => 
        filters.selectedCategories.includes(product.category)
      );
    }
    
    // Apply subcategory filter
    if (filters.selectedSubcategories.length > 0) {
      result = result.filter(product => 
        product.subcategory && filters.selectedSubcategories.includes(product.subcategory)
      );
    }
    
    // Apply brand filter
    if (filters.selectedBrands.length > 0) {
      result = result.filter(product => 
        filters.selectedBrands.includes(product.brand || '')
      );
    }
    
    // Apply price filter
    result = result.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );
    
    // Apply rating filter
    if (filters.selectedRatings.length > 0) {
      result = result.filter(product => 
        product.rating !== undefined && filters.selectedRatings.includes(Math.floor(product.rating))
      );
    }
    
    // Apply sorting
    switch (filters.sortOption) {
      case "price-low-high":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high-low":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort(() => Math.random() - 0.5);
        break;
      case "rating":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    return result;
  }, [products, filters]);

  // Paginate results
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, productsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  return {
    products: paginatedProducts,
    totalProducts: filteredProducts.length,
    totalPages,
    isLoading,
    refetch: () => {
      // Refetch will be handled by react-query
    }
  };
};
