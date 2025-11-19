import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole(user?.id);
  
  // Enable real-time notifications for admins
  useAdminNotifications(isAdmin);
  
  const {
    useSummaryMetrics,
    useRecentOrders,
    useDailySalesMetrics,
    useProductsByCategory,
    useLowStockProducts,
    useTopSellingProducts,
    useCustomerDemographics,
    useSalesByCategory
  } = useAdminDashboard();

  const { data: summaryMetrics, isLoading: metricsLoading } = useSummaryMetrics();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: dailySales, isLoading: salesLoading } = useDailySalesMetrics();
  const { data: productsByCategory, isLoading: categoryLoading } = useProductsByCategory();
  const { data: lowStockProducts, isLoading: stockLoading } = useLowStockProducts();
  const { data: topSellingProducts, isLoading: topProductsLoading } = useTopSellingProducts();
  const { data: customerDemographics, isLoading: demographicsLoading } = useCustomerDemographics();
  const { data: salesByCategory, isLoading: salesCategoryLoading } = useSalesByCategory();


  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Dashboard"
        onRefresh={() => {
          useSummaryMetrics().refetch();
          useRecentOrders().refetch();
          useDailySalesMetrics().refetch();
        }}
      />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                KSH {metricsLoading ? '...' : summaryMetrics?.totalRevenue?.toLocaleString() || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalOrders || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalProducts || '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : summaryMetrics?.totalUsers || '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Trend Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trend Analysis
            </CardTitle>
            <CardDescription>Daily revenue and order metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="h-80 flex items-center justify-center">Loading...</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Revenue (KSH)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total_orders" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
                    <div key={product.product_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.product_name}</p>
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
                <div className="h-80 flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Demographics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Demographics
              </CardTitle>
              <CardDescription>Customers by county</CardDescription>
            </CardHeader>
            <CardContent>
              {demographicsLoading ? (
                <div className="h-80 flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie
                      data={customerDemographics}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ county, customer_count }) => `${county}: ${customer_count}`}
                      outerRadius={100}
                      fill="hsl(var(--chart-2))"
                      dataKey="customer_count"
                    >
                      {customerDemographics?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
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
                <div className="space-y-2">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
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
