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
  const { data: flashSaleData, isLoading } = useQuery({
    queryKey: ['all-active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select(`
          product_id,
          discount_type,
          discount_value,
          flash_sales:flash_sale_id (
            discount_type,
            discount_value,
            end_date,
            is_active,
            start_date
          )
        `);

      if (error) throw error;

      const flashSalesMap = new Map<string, FlashSaleData>();
      
      data?.forEach((item: any) => {
        const sale = item.flash_sales;
        if (
          sale &&
          sale.is_active &&
          sale.start_date <= now &&
          sale.end_date >= now
        ) {
          // Use per-product discount if set, otherwise fall back to sale-level discount
          const discountType = item.discount_type || sale.discount_type;
          const discountValue = item.discount_value != null ? item.discount_value : sale.discount_value;
          
          flashSalesMap.set(item.product_id, {
            product_id: item.product_id,
            discount_type: discountType,
            discount_value: discountValue,
            end_date: sale.end_date,
          });
        }
      });

      return flashSalesMap;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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

export const useProductFlashSaleFromContext = (productId: string) => {
  const { flashSales, isLoading } = useFlashSaleContext();
  
  return {
    data: flashSales.get(productId) || null,
    isLoading,
  };
};
