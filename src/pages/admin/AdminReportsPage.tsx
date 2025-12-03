import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown, FileText, TrendingUp, Package, Users, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';

export default function AdminReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });

  // Sales Report
  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_id, amount, created_at, status')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (error) throw error;

      const totalRevenue = data.reduce((sum, o) => sum + (o.amount || 0), 0);
      const totalOrders = data.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completedOrders = data.filter(o => o.status === 'delivered').length;

      return {
        totalRevenue,
        totalOrders,
        avgOrderValue,
        completedOrders,
        conversionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
        orders: data
      };
    }
  });

  // Customer Report
  const { data: customerReport, isLoading: customersLoading } = useQuery({
    queryKey: ['report-customers', dateRange],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, created_at, county')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      if (profilesError) throw profilesError;

      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, amount')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      const newCustomers = profiles.length;
      const ordersByUser = orders?.reduce((acc, o) => {
        if (!acc[o.user_id!]) acc[o.user_id!] = { count: 0, total: 0 };
        acc[o.user_id!].count++;
        acc[o.user_id!].total += o.amount || 0;
        return acc;
      }, {} as Record<string, { count: number; total: number }>) || {};

      const repeatCustomers = Object.values(ordersByUser).filter(u => u.count > 1).length;
      const avgCustomerValue = Object.values(ordersByUser).reduce((sum, u) => sum + u.total, 0) / Object.keys(ordersByUser).length || 0;

      // Top locations
      const locationCounts = profiles.reduce((acc, p) => {
        if (p.county) acc[p.county] = (acc[p.county] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topLocations = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([county, count]) => ({ county, count }));

      return {
        newCustomers,
        repeatCustomers,
        avgCustomerValue,
        topLocations
      };
    }
  });

  // Product Performance Report
  const { data: productReport, isLoading: productsLoading } = useQuery({
    queryKey: ['report-products', dateRange],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('items')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);

      const productStats: Record<string, { name: string; quantity: number; revenue: number }> = {};

      orders?.forEach(order => {
        const items = order.items as any[];
        items?.forEach(item => {
          if (!productStats[item.product_id]) {
            productStats[item.product_id] = { name: item.name || 'Unknown', quantity: 0, revenue: 0 };
          }
          productStats[item.product_id].quantity += item.quantity || 0;
          productStats[item.product_id].revenue += (item.price || 0) * (item.quantity || 0);
        });
      });

      const topProducts = Object.entries(productStats)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([id, stats]) => ({ id, ...stats }));

      const totalProductsSold = Object.values(productStats).reduce((sum, p) => sum + p.quantity, 0);

      return {
        topProducts,
        totalProductsSold,
        uniqueProducts: Object.keys(productStats).length
      };
    }
  });

  // Inventory Report
  const { data: inventoryReport, isLoading: inventoryLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_id, name, stock, reorder_point, price');

      if (error) throw error;

      const lowStockProducts = data.filter(p => (p.stock || 0) <= (p.reorder_point || 5));
      const outOfStock = data.filter(p => (p.stock || 0) === 0);
      const totalInventoryValue = data.reduce((sum, p) => sum + ((p.stock || 0) * (p.price || 0)), 0);

      return {
        lowStockProducts,
        outOfStock,
        totalInventoryValue,
        totalProducts: data.length
      };
    }
  });

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
  };

  const exportSalesReport = () => {
    if (!salesReport?.orders) return;
    exportToCSV(
      salesReport.orders.map(o => ({
        order_id: o.order_id,
        amount: o.amount,
        status: o.status,
        date: format(new Date(o.created_at), 'yyyy-MM-dd HH:mm')
      })),
      'sales-report'
    );
  };

  const exportProductReport = () => {
    if (!productReport?.topProducts) return;
    exportToCSV(productReport.topProducts, 'product-performance-report');
  };

  const setQuickRange = (range: 'today' | 'week' | 'month' | 'quarter') => {
    const today = new Date();
    let from: Date;
    
    switch (range) {
      case 'today':
        from = today;
        break;
      case 'week':
        from = subDays(today, 7);
        break;
      case 'month':
        from = subMonths(today, 1);
        break;
      case 'quarter':
        from = subMonths(today, 3);
        break;
    }

    setDateRange({
      from: format(from, 'yyyy-MM-dd'),
      to: format(today, 'yyyy-MM-dd')
    });
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Reports & Analytics"
      />
      <div className="space-y-6">

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Report Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setQuickRange('today')}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('week')}>7 Days</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('month')}>30 Days</Button>
                <Button variant="outline" size="sm" onClick={() => setQuickRange('quarter')}>90 Days</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Tabs */}
        <Tabs defaultValue="sales" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
            <TabsTrigger value="customers">Customer Report</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          </TabsList>

          {/* Sales Report */}
          <TabsContent value="sales" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Sales Report</h2>
              <Button onClick={exportSalesReport} disabled={!salesReport?.orders?.length}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {salesLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">KSH {salesReport?.totalRevenue.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{salesReport?.totalOrders}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">KSH {salesReport?.avgOrderValue.toFixed(0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{salesReport?.conversionRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Customer Report */}
          <TabsContent value="customers" className="space-y-4">
            <h2 className="text-xl font-bold">Customer Report</h2>

            {customersLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerReport?.newCustomers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{customerReport?.repeatCustomers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Avg Customer Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        KSH {customerReport?.avgCustomerValue.toFixed(0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Locations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>County</TableHead>
                          <TableHead className="text-right">Customers</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerReport?.topLocations.map(({ county, count }) => (
                          <TableRow key={county}>
                            <TableCell>{county}</TableCell>
                            <TableCell className="text-right">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Product Performance */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Product Performance</h2>
              <Button onClick={exportProductReport} disabled={!productReport?.topProducts?.length}>
                <FileDown className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {productsLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Products Sold</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{productReport?.totalProductsSold}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{productReport?.uniqueProducts}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Products by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Quantity Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productReport?.topProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.name}</TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">KSH {product.revenue.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Inventory Report */}
          <TabsContent value="inventory" className="space-y-4">
            <h2 className="text-xl font-bold">Inventory Report</h2>

            {inventoryLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inventoryReport?.totalProducts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-600">
                        {inventoryReport?.lowStockProducts.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {inventoryReport?.outOfStock.length}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        KSH {inventoryReport?.totalInventoryValue.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {inventoryReport?.lowStockProducts && inventoryReport.lowStockProducts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Low Stock Alert</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Current Stock</TableHead>
                            <TableHead className="text-right">Reorder Point</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventoryReport.lowStockProducts.slice(0, 10).map((product) => (
                            <TableRow key={product.product_id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell className="text-right">{product.stock}</TableCell>
                              <TableCell className="text-right">{product.reorder_point}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
