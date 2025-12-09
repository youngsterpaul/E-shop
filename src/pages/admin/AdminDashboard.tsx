import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useRealtimeSalesAnalytics } from '@/hooks/useRealtimeSalesAnalytics';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { LiveMetricsPanel } from '@/components/admin/LiveMetricsPanel';
import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar
} from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  
  // Enable real-time notifications for admins
  useAdminNotifications(isAdmin);
  
  const {
    useRecentOrders,
    useDailySalesMetrics,
    useLowStockProducts,
    useTopSellingProducts,
    useSalesByCategory
  } = useAdminDashboard();

  const {
    useLiveMetrics,
    useHourlySales,
    useConversionFunnel,
    useWeeklyComparison,
    isLive,
    setIsLive
  } = useRealtimeSalesAnalytics();

  const { data: recentOrders, refetch: refetchOrders } = useRecentOrders();
  const { data: dailySales, isLoading: salesLoading, refetch: refetchSales } = useDailySalesMetrics();
  const { data: lowStockProducts, isLoading: stockLoading } = useLowStockProducts();
  const { data: topSellingProducts, isLoading: topProductsLoading } = useTopSellingProducts();
  const { data: salesByCategory, isLoading: salesCategoryLoading } = useSalesByCategory();

  // Real-time analytics
  const { data: liveMetrics, isLoading: liveLoading, refetch: refetchLive } = useLiveMetrics();
  const { data: hourlySales, isLoading: hourlyLoading } = useHourlySales();
  const { data: conversionFunnel, isLoading: funnelLoading } = useConversionFunnel();
  const { data: weeklyComparison, isLoading: weeklyLoading } = useWeeklyComparison();

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Dashboard"
        onRefresh={() => {
          refetchOrders();
          refetchSales();
          refetchLive();
        }}
      />

      <div className="space-y-6">
        {/* Live Metrics Panel */}
        <LiveMetricsPanel 
          liveMetrics={liveMetrics}
          weeklyComparison={weeklyComparison}
          isLoading={liveLoading || weeklyLoading}
          isLive={isLive}
          onToggleLive={() => setIsLive(!isLive)}
        />

        {/* Today's Hourly Sales & Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Hourly Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Today's Sales by Hour
              </CardTitle>
              <CardDescription>Real-time hourly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalOrders || '0'}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <ConversionFunnel data={conversionFunnel} isLoading={funnelLoading} />
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend Analysis
            </CardTitle>
            <CardDescription>Daily revenue and order metrics (historical)</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailySales}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'Revenue' ? `KSH ${value.toLocaleString()}` : value,
                      name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="total_orders" 
                    stroke="hsl(var(--chart-2))" 
                    fill="url(#ordersGradient)"
                    strokeWidth={2}
                    name="Orders"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Selling Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
              <CardDescription>Based on total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : topSellingProducts && topSellingProducts.length > 0 ? (
                <div className="space-y-3">
                  {topSellingProducts.map((product, index) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">{product.product_name}</p>
                          <p className="text-sm text-muted-foreground">{product.total_quantity} units sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">KSH {product.total_revenue.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No sales data available</p>
              )}
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
            {salesCategoryLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="h-64 w-64 rounded-full mx-auto" />
              </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="hsl(var(--primary))"
                      dataKey="total_sales"
                    >
                      {salesByCategory?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `KSH ${value.toLocaleString()}`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Products requiring restock</CardDescription>
          </CardHeader>
          <CardContent>
            {stockLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : lowStockProducts && lowStockProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStockProducts.map((product) => (
                  <div key={product.product_id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground line-clamp-1">{product.name}</p>
                      <p className="text-sm text-muted-foreground">Stock: {product.stock} units</p>
                    </div>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No low stock products</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;