import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** --- Types --- */
export type Product = {
  product_id: string;
  name: string;
  price: number;
  discount_price: number;
  reviews: number;
  rating?: number;
  description?: string;
  image_urls?: string[];
  category_id?: string;
  categories?: string;
  subcategories?: string;
  stock?: number;
  featured?: boolean;
  specification?: string | Record<string, any>;
  features?: string | string[];
};

export const PAGINATION_CONFIG = {
  DESKTOP_PAGE_SIZE: 24,
  MOBILE_PAGE_SIZE: 12,
  FEATURED_LIMIT: 100,
};

type PaginatedProducts = {
  products: Product[];
  totalCount: number;
  hasNextPage: boolean;
  nextPage?: number;
};

/** --- Helpers --- */
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

/** Generic paginated fetcher with error handling */
async function fetchPage(
  query: ReturnType<typeof supabase.from>,
  { pageParam = 0, pageSize = PAGINATION_CONFIG.DESKTOP_PAGE_SIZE } = {}
): Promise<PaginatedProducts> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

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

  return {
    products,
    totalCount: total,
    hasNextPage,
    nextPage: hasNextPage ? pageParam + 1 : undefined,
  };
}

/** --- Hook Factory --- */
export const useProducts = () => {
    const getProductsByCategory = async (categoryId: number, options: {
    pageParam: number;
    pageSize: number;
  }) => {
    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .contains('categories', [categoryId]) // or use .eq('category_id', categoryId)
      .range(
        options.pageParam * options.pageSize,
        (options.pageParam + 1) * options.pageSize - 1
      );

    if (error) throw error;

    return {
      products: data || [],
      totalCount: count || 0,
    };
  };
  /** All Products */
  const fetchProducts = (opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(supabase.from('products').select('*', { count: 'exact' }), opts);

  /** Single Product by ID */
  const fetchProductById = async (id: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_id', id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching product ${id}:`, error);
      throw new Error(error.message);
    }
    return data ? processProducts([data])[0] : null;
  };

  /** Featured Products */
  const fetchFeaturedProducts = (opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(
      supabase.from('products').select('*', { count: 'exact' }).eq('featured', true),
      opts
    );

  /** Products by Category */
  const fetchProductsByCategory = async (
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
      .eq('categories', safeCategory);

    return fetchPage(query, opts);
  };

  /** Search Products */
  const searchProducts = (term: string, opts?: { pageParam?: number; pageSize?: number }) =>
    fetchPage(
      supabase
        .from('products')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${term}%,description.ilike.%${term}%,categories.ilike.%${term}%`),
      opts
    );

  /** Product by Name */
  const fetchProductByName = async (productName: string): Promise<Product | null> => {
    const searchName = productName.replace(/-/g, ' ');
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .ilike('name', `%${searchName}%`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching product by name:', error);
      throw new Error(error.message);
    }

    return data ? processProducts([data])[0] : null;
  };

  return {
    fetchProducts,
    fetchProductById,
    fetchFeaturedProducts,
    fetchProductsByCategory,
    searchProducts,
    getProductsByCategory,
    fetchProductByName,
  };
};

/** --- React Query Hooks --- */
export const useFeaturedProducts = (pageSize?: number) => {
  const { fetchFeaturedProducts } = useProducts();
  return useInfiniteQuery({
    queryKey: ['featuredProducts', pageSize],
    queryFn: ({ pageParam }) => fetchFeaturedProducts({ pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
  });
};

export const useProduct = (id: string) => {
  const { fetchProductById } = useProducts();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};

export const useProductsByCategory = (category: string, pageSize?: number) => {
  const { fetchProductsByCategory } = useProducts();
  return useInfiniteQuery({
    queryKey: ['productsByCategory', category, pageSize],
    queryFn: ({ pageParam }) => fetchProductsByCategory(category, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: !!category,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
  });
};

export const useProductSearch = (query: string, pageSize?: number) => {
  const { searchProducts } = useProducts();
  return useInfiniteQuery({
    queryKey: ['productSearch', query, pageSize],
    queryFn: ({ pageParam }) => searchProducts(query, { pageParam, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (last) => last.nextPage,
    enabled: query.trim().length > 1,
    select: (data) => ({
      ...data,
      products: data.pages.flatMap((p) => p.products),
      totalCount: data.pages[0]?.totalCount || 0,
      hasNextPage: data.pages.at(-1)?.hasNextPage || false,
    }),
  });
};

/** Backward Compatibility */
export const useProductByName = (productName: string) => {
  const { fetchProductByName } = useProducts();
  return useQuery({
    queryKey: ['product', 'name', productName],
    queryFn: () => fetchProductByName(productName),
    enabled: !!productName,
    staleTime: 5 * 60 * 1000,
  });
};
