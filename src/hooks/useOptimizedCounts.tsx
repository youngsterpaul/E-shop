import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Optimized hook for getting counts without fetching full data
export const useOptimizedCounts = () => {
  return useQuery({
    queryKey: ['dashboard-counts'],
    queryFn: async () => {
      const [
        { count: productsCount },
        { count: ordersCount },
        { count: usersCount }
      ] = await Promise.all([
        supabase.from('products').select('product_id', { count: 'exact', head: true }),
        supabase.from('orders').select('order_id', { count: 'exact', head: true }),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true })
      ]);

      return {
        products: productsCount || 0,
        orders: ordersCount || 0,
        users: usersCount || 0
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000
  });
};