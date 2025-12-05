import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HourlyMetric {
  hour: string;
  revenue: number;
  orders: number;
}

interface ConversionFunnelData {
  stage: string;
  value: number;
  percentage: number;
  color: string;
}

interface LiveMetrics {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  pendingOrders: number;
  processingOrders: number;
}

export const useRealtimeSalesAnalytics = () => {
  const queryClient = useQueryClient();
  const [isLive, setIsLive] = useState(true);

  // Real-time subscription for orders
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('realtime-sales')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Invalidate and refetch all analytics queries
          queryClient.invalidateQueries({ queryKey: ['live-metrics'] });
          queryClient.invalidateQueries({ queryKey: ['hourly-sales'] });
          queryClient.invalidateQueries({ queryKey: ['conversion-funnel'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive, queryClient]);

  // Live metrics for today
  const useLiveMetrics = () => useQuery({
    queryKey: ['live-metrics'],
    queryFn: async (): Promise<LiveMetrics> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch today's orders
      const { data: todayOrders, error } = await supabase
        .from('orders')
        .select('order_id, amount, status, created_at')
        .gte('created_at', todayISO);

      if (error) throw error;

      const orders = todayOrders || [];
      const completedOrders = orders.filter(o => 
        ['delivered', 'shipped', 'packed', 'processing', 'paid'].includes(o.status)
      );
      
      const todayRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      const avgOrderValue = completedOrders.length > 0 ? todayRevenue / completedOrders.length : 0;
      
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const processingOrders = orders.filter(o => o.status === 'processing').length;

      // Calculate conversion rate (completed orders / total orders)
      const conversionRate = orders.length > 0 
        ? (completedOrders.length / orders.length) * 100 
        : 0;

      return {
        todayRevenue,
        todayOrders: orders.length,
        avgOrderValue,
        conversionRate,
        pendingOrders,
        processingOrders
      };
    },
    refetchInterval: isLive ? 30000 : false, // Refetch every 30 seconds when live
  });

  // Hourly sales for today
  const useHourlySales = () => useQuery({
    queryKey: ['hourly-sales'],
    queryFn: async (): Promise<HourlyMetric[]> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: orders, error } = await supabase
        .from('orders')
        .select('amount, created_at, status')
        .gte('created_at', todayISO)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;

      // Group by hour
      const hourlyData: Record<string, { revenue: number; orders: number }> = {};
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        const hourStr = `${i.toString().padStart(2, '0')}:00`;
        hourlyData[hourStr] = { revenue: 0, orders: 0 };
      }

      // Populate with actual data
      orders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        hourlyData[hourStr].revenue += Number(order.amount) || 0;
        hourlyData[hourStr].orders += 1;
      });

      return Object.entries(hourlyData).map(([hour, data]) => ({
        hour,
        revenue: data.revenue,
        orders: data.orders
      }));
    },
    refetchInterval: isLive ? 60000 : false, // Refetch every minute when live
  });

  // Conversion funnel
  const useConversionFunnel = () => useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: async (): Promise<ConversionFunnelData[]> => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Get carts created in last 30 days
      const { data: carts, error: cartsError } = await supabase
        .from('carts')
        .select('id, status, item_count')
        .gte('created_at', thirtyDaysAgoISO);

      if (cartsError) throw cartsError;

      // Get orders in last 30 days
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('order_id, status')
        .gte('created_at', thirtyDaysAgoISO);

      if (ordersError) throw ordersError;

      const totalCarts = carts?.length || 0;
      const cartsWithItems = carts?.filter(c => (c.item_count || 0) > 0).length || 0;
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => 
        ['delivered', 'shipped', 'packed', 'processing', 'paid'].includes(o.status)
      ).length || 0;

      const baseValue = Math.max(totalCarts, cartsWithItems, totalOrders, 1);

      return [
        {
          stage: 'Cart Created',
          value: totalCarts,
          percentage: 100,
          color: '#3b82f6'
        },
        {
          stage: 'Items Added',
          value: cartsWithItems,
          percentage: totalCarts > 0 ? (cartsWithItems / totalCarts) * 100 : 0,
          color: '#8b5cf6'
        },
        {
          stage: 'Checkout Started',
          value: totalOrders,
          percentage: cartsWithItems > 0 ? (totalOrders / cartsWithItems) * 100 : 0,
          color: '#f59e0b'
        },
        {
          stage: 'Order Completed',
          value: completedOrders,
          percentage: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
          color: '#10b981'
        }
      ];
    },
    refetchInterval: isLive ? 60000 : false,
  });

  // Weekly comparison
  const useWeeklyComparison = () => useQuery({
    queryKey: ['weekly-comparison'],
    queryFn: async () => {
      const now = new Date();
      
      // This week
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      
      // Last week
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);

      const { data: thisWeekOrders } = await supabase
        .from('orders')
        .select('amount')
        .gte('created_at', thisWeekStart.toISOString())
        .not('status', 'eq', 'cancelled');

      const { data: lastWeekOrders } = await supabase
        .from('orders')
        .select('amount')
        .gte('created_at', lastWeekStart.toISOString())
        .lt('created_at', lastWeekEnd.toISOString())
        .not('status', 'eq', 'cancelled');

      const thisWeekRevenue = thisWeekOrders?.reduce((sum, o) => sum + (Number(o.amount) || 0), 0) || 0;
      const lastWeekRevenue = lastWeekOrders?.reduce((sum, o) => sum + (Number(o.amount) || 0), 0) || 0;

      const revenueChange = lastWeekRevenue > 0 
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
        : thisWeekRevenue > 0 ? 100 : 0;

      const ordersChange = lastWeekOrders && lastWeekOrders.length > 0
        ? (((thisWeekOrders?.length || 0) - lastWeekOrders.length) / lastWeekOrders.length) * 100
        : (thisWeekOrders?.length || 0) > 0 ? 100 : 0;

      return {
        thisWeekRevenue,
        lastWeekRevenue,
        revenueChange,
        thisWeekOrders: thisWeekOrders?.length || 0,
        lastWeekOrders: lastWeekOrders?.length || 0,
        ordersChange
      };
    }
  });

  return {
    useLiveMetrics,
    useHourlySales,
    useConversionFunnel,
    useWeeklyComparison,
    isLive,
    setIsLive
  };
};