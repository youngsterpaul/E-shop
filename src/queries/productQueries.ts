/**
 * Centralized Product Queries
 * 
 * This file provides:
 * - Consistent query keys for all product-related data
 * - Centralized fetcher functions
 * - Type-safe query options for React Query
 * - Offline caching support via IndexedDB
 * 
 * Benefits:
 * - Prevents duplicate network requests
 * - Enables automatic cache sharing across components
 * - Provides single source of truth for product data
 * - Products are cached for offline access
 */

import { supabase } from '@/integrations/supabase/client';
import { UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { PRODUCT_LIST_FIELDS, PRODUCT_DETAIL_FIELDS } from '@/utils/queryOptimizations';
import { cacheProducts, getCachedProducts, getCachedProduct } from '@/utils/offlineStorage';

// ============================================================================
// TYPES
// ============================================================================

export type Product = {
  attributes?: Record<string, any>;
  product_id: string;
  name: string;
  price: number;
  discount_price?: number;
  reviews?: number; // Legacy field
  reviews_count?: number; // New accurate count from DB
  rating?: number;
  description?: string;
  image_urls?: string[];
  category_id?: string;
  categories?: string;
  subcategories?: string;
  subcategory_id?: number;
  stock?: number;
  featured?: boolean;
  specification?: string | Record<string, any>;
  features?: string | string[];
};

export type PaginatedProducts = {
  products: Product[];
  totalCount: number;
  hasNextPage: boolean;
  nextPage?: number;
};

export const PAGINATION_CONFIG = {
  DESKTOP_PAGE_SIZE: 24,
  MOBILE_PAGE_SIZE: 12,
  FEATURED_LIMIT: 100,
};

// ============================================================================
// QUERY KEYS
// ============================================================================

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featured: (pageSize?: number) => [...productKeys.all, 'featured', pageSize] as const,
  category: (category: string, pageSize?: number) => 
    [...productKeys.all, 'category', category, pageSize] as const,
  categoryById: (categoryId: number, pageSize?: number) =>
    [...productKeys.all, 'categoryById', categoryId, pageSize] as const,
  search: (query: string, pageSize?: number) => 
    [...productKeys.all, 'search', query, pageSize] as const,
  related: (category: string, currentProductId: string) =>
    [...productKeys.all, 'related', category, currentProductId] as const,
  reviews: (productId: string) => ['reviews', productId] as const,
};

// ============================================================================
// HELPERS
// ============================================================================

const processProducts = (products: any[]): Product[] =>
  products.map((p) => ({
    ...p,
    specification:
      typeof p.specification === 'string' && p.specification
        ? (() => {
            try {
              return JSON.parse(p.specification);
            } catch {
              return {};
            }
          })()
        : p.specification || {},
  }));

/**
 * Cache products for offline use (non-blocking)
 */
const cacheProductsForOffline = (products: Product[]) => {
  if (products.length > 0) {
    cacheProducts(products).catch(err => {
      console.warn('Failed to cache products for offline:', err);
    });
  }
};

/**
 * Check if we're online
 */
const isOnline = () => typeof navigator !== 'undefined' && navigator.onLine;

async function fetchPage(
  query: ReturnType<typeof supabase.from>,
  { pageParam = 0, pageSize = PAGINATION_CONFIG.DESKTOP_PAGE_SIZE } = {}
): Promise<PaginatedProducts> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  // If offline, try to get cached products
  if (!isOnline()) {
    console.log('Offline: Using cached products');
    const cachedProducts = await getCachedProducts();
    const paginatedCached = cachedProducts.slice(from, to + 1);
    return {
      products: paginatedCached,
      totalCount: cachedProducts.length,
      hasNextPage: cachedProducts.length > to + 1,
      nextPage: cachedProducts.length > to + 1 ? pageParam + 1 : undefined,
    };
  }

  try {
    const { data, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      throw new Error(error.message);
    }

    const total = count || 0;
    const products = processProducts(data || []);
    const hasNextPage = total > from + products.length;

    // Cache products for offline use
    cacheProductsForOffline(products);

    return {
      products,
      totalCount: total,
      hasNextPage,
      nextPage: hasNextPage ? pageParam + 1 : undefined,
    };
  } catch (error) {
    // If network fails, try cached data
    console.log('Network error, falling back to cache:', error);
    const cachedProducts = await getCachedProducts();
    const paginatedCached = cachedProducts.slice(from, to + 1);
    return {
      products: paginatedCached,
      totalCount: cachedProducts.length,
      hasNextPage: cachedProducts.length > to + 1,
      nextPage: cachedProducts.length > to + 1 ? pageParam + 1 : undefined,
    };
  }
}

// ============================================================================
// FETCHERS
// ============================================================================

export const productFetchers = {
  /** Fetch all products with pagination */
  fetchProducts: (opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(supabase.from('products').select('*', { count: 'exact' }), opts),

  /** Fetch single product by ID */
  fetchProductById: async (id: string): Promise<Product | null> => {
    // Try cached first if offline
    if (!isOnline()) {
      console.log('Offline: Using cached product');
      const cached = await getCachedProduct(id);
      return cached ? processProducts([cached])[0] : null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', id)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching product ${id}:`, error);
        throw new Error(error.message);
      }
      
      if (data) {
        const processed = processProducts([data])[0];
        // Cache this product
        cacheProductsForOffline([processed]);
        return processed;
      }
      return null;
    } catch (error) {
      // Fallback to cache on error
      console.log('Network error, falling back to cached product:', error);
      const cached = await getCachedProduct(id);
      return cached ? processProducts([cached])[0] : null;
    }
  },

  /** Fetch featured products ordered by display_order */
  fetchFeaturedProducts: async (opts?: { pageParam?: number; pageSize?: number }): Promise<PaginatedProducts> => {
    const pageParam = opts?.pageParam ?? 0;
    const pageSize = opts?.pageSize ?? PAGINATION_CONFIG.DESKTOP_PAGE_SIZE;
    const from = pageParam * pageSize;
    const to = from + pageSize - 1;

    // If offline, use cached products
    if (!isOnline()) {
      console.log('Offline: Using cached featured products');
      const cachedProducts = await getCachedProducts();
      const featuredCached = cachedProducts.filter(p => p.featured);
      const paginatedCached = featuredCached.slice(from, to + 1);
      return {
        products: paginatedCached,
        totalCount: featuredCached.length,
        hasNextPage: featuredCached.length > to + 1,
        nextPage: featuredCached.length > to + 1 ? pageParam + 1 : undefined,
      };
    }

    try {
      const { data, error, count } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('featured', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Supabase fetch error:', error);
        throw new Error(error.message);
      }

      const total = count || 0;
      const products = processProducts(data || []);
      const hasNextPage = total > from + products.length;

      // Cache products for offline use
      cacheProductsForOffline(products);

      return {
        products,
        totalCount: total,
        hasNextPage,
        nextPage: hasNextPage ? pageParam + 1 : undefined,
      };
    } catch (error) {
      // Fallback to cache on error
      console.log('Network error, falling back to cached products:', error);
      const cachedProducts = await getCachedProducts();
      const featuredCached = cachedProducts.filter(p => p.featured);
      const paginatedCached = featuredCached.slice(from, to + 1);
      return {
        products: paginatedCached,
        totalCount: featuredCached.length,
        hasNextPage: featuredCached.length > to + 1,
        nextPage: featuredCached.length > to + 1 ? pageParam + 1 : undefined,
      };
    }
  },

  /** Fetch products by category name */
  fetchProductsByCategory: async (
    category: string,
    opts?: { pageParam?: number; pageSize?: number }
  ): Promise<PaginatedProducts> => {
    if (!category?.trim()) {
      console.warn('Skipping fetch — no category provided');
      return { products: [], totalCount: 0, hasNextPage: false, nextPage: undefined };
    }

    const safeCategory = category.trim();

    const query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .ilike('categories', `%${safeCategory}%`);

    return fetchPage(query, opts);
  },

  /** Fetch products by category ID with robust fallbacks */
  fetchProductsByCategoryId: async (
    categoryId: number,
    opts?: { pageParam?: number; pageSize?: number },
    fallback?: { categoryName?: string; parentName?: string }
  ): Promise<PaginatedProducts> => {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, category, parent_id')
      .eq('id', categoryId)
      .maybeSingle();

    const runQuery = (orFilters: string) =>
      fetchPage(
        supabase
          .from('products')
          .select('*', { count: 'exact' })
          .or(orFilters),
        opts
      );

    if (categoryData) {
      let fullCategoryName = categoryData.category;

      if (categoryData.parent_id) {
        const { data: parentData } = await supabase
          .from('categories')
          .select('category')
          .eq('id', categoryData.parent_id)
          .maybeSingle();
        if (parentData) fullCategoryName = `${parentData.category} > ${categoryData.category}`;
      }

      let childIds: number[] = [];
      if (!categoryData.parent_id) {
        const { data: children } = await supabase
          .from('categories')
          .select('id, category')
          .eq('parent_id', categoryId);
        childIds = (children || []).map((c: any) => c.id);
      }

      const orParts: string[] = [];
      orParts.push(`subcategory_id.eq.${categoryId}`);
      orParts.push(`categories.ilike.%${categoryData.category}%`);
      orParts.push(`categories.eq.${fullCategoryName}`);
      if (childIds.length > 0) {
        orParts.push(`subcategory_id.in.(${childIds.join(',')})`);
      }

      return runQuery(orParts.join(','));
    }

    if (fallback?.categoryName) {
      const name = fallback.categoryName;
      const full = fallback.parentName ? `${fallback.parentName} > ${name}` : name;
      const orParts = [
        `categories.eq.${full}`,
        `categories.ilike.%${name}%`,
        `subcategory_id.eq.${categoryId}`,
      ];
      return runQuery(orParts.join(','));
    }

    return { products: [], totalCount: 0, hasNextPage: false, nextPage: undefined };
  },

  /** Search products */
  searchProducts: (term: string, opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(
      supabase
        .from('products')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,categories.ilike.%${term}%`),
      opts
    ),

  /** Fetch product by name */
  fetchProductByName: async (productName: string): Promise<Product | null> => {
    const searchName = productName.replace(/-/g, ' ');
    
    // If offline, search in cache
    if (!isOnline()) {
      console.log('Offline: Searching cached products by name');
      const cachedProducts = await getCachedProducts();
      const found = cachedProducts.find(p => 
        p.name.toLowerCase().includes(searchName.toLowerCase())
      );
      return found ? processProducts([found])[0] : null;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchName}%`)
        .maybeSingle();

      if (error) {
        console.error('Error fetching product by name:', error);
        throw new Error(error.message);
      }

      if (data) {
        const processed = processProducts([data])[0];
        cacheProductsForOffline([processed]);
        return processed;
      }
      return null;
    } catch (error) {
      // Fallback to cache
      console.log('Network error, searching cached products:', error);
      const cachedProducts = await getCachedProducts();
      const found = cachedProducts.find(p => 
        p.name.toLowerCase().includes(searchName.toLowerCase())
      );
      return found ? processProducts([found])[0] : null;
    }
  },

  /** Fetch related products by category */
  fetchRelatedProducts: async (
    category: string,
    currentProductId: string,
    limit: number = 12
  ): Promise<Product[]> => {
    // If offline, use cached products
    if (!isOnline()) {
      console.log('Offline: Using cached related products');
      const cachedProducts = await getCachedProducts();
      return cachedProducts
        .filter(p => p.categories?.includes(category) && p.product_id !== currentProductId)
        .slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_FIELDS)
        .ilike('categories', `%${category}%`)
        .neq('product_id', currentProductId)
        .limit(limit);

      if (error) {
        console.error('Error fetching related products:', error);
        throw new Error(error.message);
      }

      const products = processProducts(data || []);
      // Cache these products
      cacheProductsForOffline(products);

      return products;
    } catch (error) {
      // Fallback to cache
      console.log('Network error, falling back to cached related products:', error);
      const cachedProducts = await getCachedProducts();
      return cachedProducts
        .filter(p => p.categories?.includes(category) && p.product_id !== currentProductId)
        .slice(0, limit);
    }
  },

  /** Fetch product reviews with replies */
  fetchProductReviews: async (productId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        review_replies (
          id,
          reply_text,
          user_id,
          created_at,
          updated_at
        )
      `)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(error.message);
    }
    return data;
  },
};
