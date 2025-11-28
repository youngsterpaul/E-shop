import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FlashSaleData {
  product_id: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  end_date: string;
}

interface FlashSaleContextType {
  flashSales: Map<string, FlashSaleData>;
  isLoading: boolean;
}

const FlashSaleContext = createContext<FlashSaleContextType>({
  flashSales: new Map(),
  isLoading: false,
});

export const useFlashSaleContext = () => useContext(FlashSaleContext);

export const FlashSaleProvider = ({ children }: { children: ReactNode }) => {
  // Fetch all active flash sale products in a single query
  const { data: flashSaleData, isLoading } = useQuery({
    queryKey: ['all-active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select(`
          product_id,
          flash_sales:flash_sale_id (
            discount_type,
            discount_value,
            end_date,
            is_active,
            start_date
          )
        `);

      if (error) throw error;

      // Filter and map to product_id -> flash sale data
      const flashSalesMap = new Map<string, FlashSaleData>();
      
      data?.forEach((item: any) => {
        const sale = item.flash_sales;
        // Check if flash sale is active and not expired
        if (
          sale &&
          sale.is_active &&
          sale.start_date <= now &&
          sale.end_date >= now
        ) {
          flashSalesMap.set(item.product_id, {
            product_id: item.product_id,
            discount_type: sale.discount_type,
            discount_value: sale.discount_value,
            end_date: sale.end_date,
          });
        }
      });

      return flashSalesMap;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
  });

  return (
    <FlashSaleContext.Provider
      value={{
        flashSales: flashSaleData || new Map(),
        isLoading,
      }}
    >
      {children}
    </FlashSaleContext.Provider>
  );
};

// Hook to get flash sale for a specific product
export const useProductFlashSaleFromContext = (productId: string) => {
  const { flashSales, isLoading } = useFlashSaleContext();
  
  return {
    data: flashSales.get(productId) || null,
    isLoading,
  };
};
