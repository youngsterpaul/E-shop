
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

interface TopSellingProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

interface CustomerDemographic {
  county: string;
  customer_count: number;
}

interface SalesByCategory {
  category: string;
  total_sales: number;
  order_count: number;
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
      .not('reorder_point', 'is', null)
      .order('stock', { ascending: true })
      .limit(5);
      
    if (error) throw error;
    
    // Filter products where stock is at or below reorder point
    return data?.filter(product => 
      (product.stock ?? 0) <= (product.reorder_point ?? 10)
    ) || [];
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

  // Fetch top-selling products
  const fetchTopSellingProducts = async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items')
      .not('items', 'is', null);
    
    if (error) throw error;
    
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    orders.forEach(order => {
      const items = order.items as any[];
      items?.forEach(item => {
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = {
            name: item.name || 'Unknown Product',
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.product_id].quantity += item.quantity || 0;
        productSales[item.product_id].revenue += (item.price || 0) * (item.quantity || 0);
      });
    });
    
    return Object.entries(productSales)
      .map(([product_id, data]) => ({
        product_id,
        product_name: data.name,
        total_quantity: data.quantity,
        total_revenue: data.revenue
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5) as TopSellingProduct[];
  };

  // Fetch customer demographics
  const fetchCustomerDemographics = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('county')
      .not('county', 'is', null);
    
    if (error) throw error;
    
    const demographics: Record<string, number> = {};
    data.forEach(profile => {
      if (profile.county) {
        demographics[profile.county] = (demographics[profile.county] || 0) + 1;
      }
    });
    
    return Object.entries(demographics)
      .map(([county, customer_count]) => ({ county, customer_count }))
      .sort((a, b) => b.customer_count - a.customer_count)
      .slice(0, 6) as CustomerDemographic[];
  };

  // Fetch sales by category
  const fetchSalesByCategory = async () => {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('items, amount')
      .not('items', 'is', null);
    
    if (error) throw error;
    
    const categorySales: Record<string, { sales: number; count: number }> = {};
    
    orders.forEach(order => {
      const items = order.items as any[];
      items?.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categorySales[category]) {
          categorySales[category] = { sales: 0, count: 0 };
        }
        categorySales[category].sales += (item.price || 0) * (item.quantity || 0);
        categorySales[category].count += 1;
      });
    });
    
    return Object.entries(categorySales)
      .map(([category, data]) => ({
        category,
        total_sales: data.sales,
        order_count: data.count
      }))
      .sort((a, b) => b.total_sales - a.total_sales) as SalesByCategory[];
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
    }),
    useTopSellingProducts: () => useQuery({
      queryKey: ['adminTopSellingProducts'],
      queryFn: fetchTopSellingProducts
    }),
    useCustomerDemographics: () => useQuery({
      queryKey: ['adminCustomerDemographics'],
      queryFn: fetchCustomerDemographics
    }),
    useSalesByCategory: () => useQuery({
      queryKey: ['adminSalesByCategory'],
      queryFn: fetchSalesByCategory
    })
  };
};
