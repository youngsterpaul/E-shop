import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FlashSale {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  product_ids?: string[];
}

export interface FlashSaleProduct {
  id: string;
  flash_sale_id: string;
  product_id: string;
  created_at: string;
}

// Fetch active flash sales
export const useActiveFlashSales = () => {
  return useQuery({
    queryKey: ['flash-sales', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as FlashSale[];
    },
    staleTime: 60 * 1000, // 1 minute
  });
};

// Fetch all flash sales (admin)
export const useAllFlashSales = () => {
  return useQuery({
    queryKey: ['flash-sales', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FlashSale[];
    },
  });
};

// Fetch flash sale products
export const useFlashSaleProducts = (flashSaleId?: string) => {
  return useQuery({
    queryKey: ['flash-sale-products', flashSaleId],
    queryFn: async () => {
      if (!flashSaleId) return [];
      
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select('*')
        .eq('flash_sale_id', flashSaleId);

      if (error) throw error;
      return data as FlashSaleProduct[];
    },
    enabled: !!flashSaleId,
  });
};

// Check if product has active flash sale
export const useProductFlashSale = (productId: string) => {
  return useQuery({
    queryKey: ['product-flash-sale', productId],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select(`
          *,
          flash_sales:flash_sale_id (
            id,
            title,
            discount_type,
            discount_value,
            end_date
          )
        `)
        .eq('product_id', productId);

      if (error) throw error;

      // Filter for active flash sales
      const activeFlashSale = data?.find((item: any) => {
        const sale = item.flash_sales;
        return (
          sale &&
          sale.end_date >= now &&
          new Date(sale.end_date) >= new Date()
        );
      });

      return activeFlashSale ? activeFlashSale.flash_sales : null;
    },
    staleTime: 60 * 1000,
  });
};

// Create flash sale
export const useCreateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      flashSale: Omit<FlashSale, 'id' | 'created_at' | 'updated_at'>;
      productIds: string[];
    }) => {
      // Insert flash sale
      const { data: flashSale, error: saleError } = await supabase
        .from('flash_sales')
        .insert(data.flashSale)
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert flash sale products
      if (data.productIds.length > 0) {
        const products = data.productIds.map((productId) => ({
          flash_sale_id: flashSale.id,
          product_id: productId,
        }));

        const { error: productsError } = await supabase
          .from('flash_sale_products')
          .insert(products);

        if (productsError) throw productsError;
      }

      return flashSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast.success('Flash sale created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create flash sale');
    },
  });
};

// Update flash sale
export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      flashSale: Partial<FlashSale>;
      productIds?: string[];
    }) => {
      // Update flash sale
      const { error: saleError } = await supabase
        .from('flash_sales')
        .update(data.flashSale)
        .eq('id', data.id);

      if (saleError) throw saleError;

      // Update products if provided
      if (data.productIds) {
        // Delete existing products
        await supabase
          .from('flash_sale_products')
          .delete()
          .eq('flash_sale_id', data.id);

        // Insert new products
        if (data.productIds.length > 0) {
          const products = data.productIds.map((productId) => ({
            flash_sale_id: data.id,
            product_id: productId,
          }));

          const { error: productsError } = await supabase
            .from('flash_sale_products')
            .insert(products);

          if (productsError) throw productsError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['product-flash-sale'] });
      toast.success('Flash sale updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update flash sale');
    },
  });
};

// Delete flash sale
export const useDeleteFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast.success('Flash sale deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete flash sale');
    },
  });
};

// Toggle flash sale active status
export const useToggleFlashSale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('flash_sales')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      queryClient.invalidateQueries({ queryKey: ['product-flash-sale'] });
    },
  });
};

// Fetch products for a specific flash sale with pagination
export const useFlashSaleProductsWithDetails = (flashSaleId?: string, pageSize: number = 12) => {
  return useQuery({
    queryKey: ['flash-sale-products-details', flashSaleId, pageSize],
    queryFn: async () => {
      if (!flashSaleId) return { products: [], totalCount: 0 };
      
      // Get product IDs from flash_sale_products
      const { data: flashSaleProducts, error: flashSaleError } = await supabase
        .from('flash_sale_products')
        .select('product_id')
        .eq('flash_sale_id', flashSaleId);

      if (flashSaleError) throw flashSaleError;
      if (!flashSaleProducts || flashSaleProducts.length === 0) {
        return { products: [], totalCount: 0 };
      }

      const productIds = flashSaleProducts.map(p => p.product_id);

      // Fetch product details
      const { data: products, error: productsError, count } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          price,
          image_urls,
          categories,
          stock,
          rating,
          reviews_count
        `, { count: 'exact' })
        .in('product_id', productIds)
        .limit(pageSize);

      if (productsError) throw productsError;

      return {
        products: products || [],
        totalCount: count || 0
      };
    },
    enabled: !!flashSaleId,
    staleTime: 60 * 1000,
  });
};

// Fetch ALL products from ALL active flash sales
export const useAllActiveFlashSaleProducts = (pageSize: number = 12) => {
  return useQuery({
    queryKey: ['all-active-flash-sale-products', pageSize],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      // Get all active flash sale IDs
      const { data: activeSales, error: salesError } = await supabase
        .from('flash_sales')
        .select('id, end_date')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (salesError) throw salesError;
      if (!activeSales || activeSales.length === 0) {
        return { products: [], totalCount: 0, earliestEndDate: null };
      }

      const saleIds = activeSales.map(s => s.id);
      // Get the earliest end date for countdown
      const earliestEndDate = activeSales.reduce((earliest, sale) => {
        return !earliest || new Date(sale.end_date) < new Date(earliest) 
          ? sale.end_date 
          : earliest;
      }, activeSales[0].end_date);

      // Get ALL product IDs from all active flash sales
      const { data: flashSaleProducts, error: flashSaleError } = await supabase
        .from('flash_sale_products')
        .select('product_id')
        .in('flash_sale_id', saleIds);

      if (flashSaleError) throw flashSaleError;
      if (!flashSaleProducts || flashSaleProducts.length === 0) {
        return { products: [], totalCount: 0, earliestEndDate };
      }

      // Get unique product IDs
      const productIds = [...new Set(flashSaleProducts.map(p => p.product_id))];

      // Fetch product details
      const { data: products, error: productsError, count } = await supabase
        .from('products')
        .select(`
          product_id,
          name,
          price,
          image_urls,
          categories,
          stock,
          rating,
          reviews_count
        `, { count: 'exact' })
        .in('product_id', productIds)
        .limit(pageSize);

      if (productsError) throw productsError;

      return {
        products: products || [],
        totalCount: count || 0,
        earliestEndDate
      };
    },
    staleTime: 60 * 1000,
  });
};