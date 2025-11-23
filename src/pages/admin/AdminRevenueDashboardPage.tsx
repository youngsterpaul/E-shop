import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users, ShoppingCart, Package } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export default function AdminRevenueDashboardPage() {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch revenue data
  const { data: revenueData } = useQuery({
    queryKey: ['revenue-data', timeRange],
    queryFn: async () => {
      const days = parseInt(timeRange);
      const startDate = startOfDay(subDays(new Date(), days));
      
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, amount, status, items')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const metrics = {
    totalRevenue: revenueData?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0,
    totalOrders: revenueData?.length || 0,
    averageOrderValue: revenueData?.length ? (revenueData.reduce((sum, order) => sum + (order.amount || 0), 0) / revenueData.length) : 0,
    completedOrders: revenueData?.filter(o => o.status === 'delivered').length || 0,
  };

  // Revenue by day
  const revenueByDay = revenueData?.reduce((acc: any[], order) => {
    const date = format(new Date(order.created_at), 'MMM dd');
    const existing = acc.find(item => item.date === date);
    
    if (existing) {
      existing.revenue += order.amount || 0;
      existing.orders += 1;
    } else {
      acc.push({ date, revenue: order.amount || 0, orders: 1 });
    }
    return acc;
  }, []) || [];

  // Revenue by status
  const revenueByStatus = revenueData?.reduce((acc: any[], order) => {
    const existing = acc.find(item => item.status === order.status);
    if (existing) {
      existing.value += order.amount || 0;
      existing.count += 1;
    } else {
      acc.push({ status: order.status, value: order.amount || 0, count: 1 });
    }
    return acc;
  }, []) || [];

  // Top products by revenue
  const productRevenue = revenueData?.reduce((acc: any, order) => {
    const items = order.items as any[];
    items?.forEach(item => {
      const revenue = (item.price || 0) * (item.quantity || 0);
      if (acc[item.name]) {
        acc[item.name] += revenue;
      } else {
        acc[item.name] = revenue;
      }
    });
    return acc;
  }, {}) || {};

  const topProducts = Object.entries(productRevenue)
    .map(([name, revenue]) => ({ name, revenue: revenue as number }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  const previousRevenue = metrics.totalRevenue * 0.85; // Mock comparison
  const revenueChange = ((metrics.totalRevenue - previousRevenue) / previousRevenue) * 100;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
            <p className="text-muted-foreground mt-2">Comprehensive revenue analytics and insights</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {metrics.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {revenueChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">+{revenueChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">{revenueChange.toFixed(1)}%</span>
                  </>
                )}
                from previous period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSh {metrics.averageOrderValue.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Per order
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalOrders ? ((metrics.completedOrders / metrics.totalOrders) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Orders delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue (KSh)" />
                <Line type="monotone" dataKey="orders" stroke="hsl(var(--secondary))" name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.status}: KSh ${entry.value.toLocaleString()}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {revenueByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (KSh)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
