
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetric {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_customers: number;
}

interface ProductsByCategory {
  category: string;
  count: number;
}

interface AdminSettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  created_at: string;
  updated_at: string;
}

export const useAdminDashboard = () => {
  // Fetch recent orders
  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (error) throw error;
    return data;
  };
  
  // Fetch daily sales metrics for the chart
  const fetchDailySalesMetrics = async () => {
    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .order('date', { ascending: true });
      
    if (error) throw error;
    return data as DashboardMetric[];
  };
  
  // Fetch products by category
  const fetchProductsByCategory = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('categories')
      .not('categories', 'is', null);
      
    if (error) throw error;
    
    const categories: Record<string, number> = {};
    data.forEach(product => {
      if (product.categories) {
        categories[product.categories] = (categories[product.categories] || 0) + 1;
      }
    });
    
    return Object.entries(categories).map(([category, count]) => ({
      category,
      count
    })) as ProductsByCategory[];
  };
  
  // Fetch low stock products
  const fetchLowStockProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .lt('stock', 10)
      .limit(5);
      
    if (error) throw error;
    return data;
  };
  
  // Fetch admin settings
  const fetchAdminSettings = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('*');
      
    if (error) throw error;
    return data as AdminSettings[];
  };
  
  // Calculate summary metrics
  const fetchSummaryMetrics = async () => {
    const [totalProducts, totalOrders, totalRevenue, totalUsers] = await Promise.all([
      supabase.from('products').select('product_id', { count: 'exact', head: true }),
      supabase.from('orders').select('order_id', { count: 'exact', head: true }),
      supabase.from('orders').select('amount').not('amount', 'is', null),
      supabase.from('profiles').select('user_id', { count: 'exact', head: true })
    ]);
    
    let revenue = 0;
    if (totalRevenue.data) {
      revenue = totalRevenue.data.reduce((sum, order) => sum + (order.amount || 0), 0);
    }
    
    return {
      totalProducts: totalProducts.count || 0,
      totalOrders: totalOrders.count || 0,
      totalRevenue: revenue,
      totalUsers: totalUsers.count || 0
    };
  };
  
  return {
    useRecentOrders: () => useQuery({
      queryKey: ['adminRecentOrders'],
      queryFn: fetchRecentOrders
    }),
    useDailySalesMetrics: () => useQuery({
      queryKey: ['adminDailySalesMetrics'],
      queryFn: fetchDailySalesMetrics
    }),
    useProductsByCategory: () => useQuery({
      queryKey: ['adminProductsByCategory'],
      queryFn: fetchProductsByCategory
    }),
    useLowStockProducts: () => useQuery({
      queryKey: ['adminLowStockProducts'],
      queryFn: fetchLowStockProducts
    }),
    useAdminSettings: () => useQuery({
      queryKey: ['adminSettings'],
      queryFn: fetchAdminSettings
    }),
    useSummaryMetrics: () => useQuery({
      queryKey: ['adminSummaryMetrics'],
      queryFn: fetchSummaryMetrics
    })
  };
};
