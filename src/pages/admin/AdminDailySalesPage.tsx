import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, DollarSign, ShoppingCart, Users, Plus, Pencil, Trash2, 
  ChevronDown, TrendingUp, TrendingDown, RefreshCw, Zap, ArrowUpRight,
  BarChart3, Filter
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const AdminDailySalesPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { useDailySalesMetrics } = useAdminDashboard();
  const { data: dailySales, isLoading, refetch } = useDailySalesMetrics();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    total_revenue: '',
    total_orders: '',
    total_customers: ''
  });
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month' | 'all'>('30d');
  const [chartType, setChartType] = useState<'revenue' | 'orders' | 'customers'>('revenue');
  const [isSyncing, setIsSyncing] = useState(false);

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(10);

  // Filter sales by date range
  const filteredSales = (() => {
    if (!dailySales) return [];
    const now = new Date();
    
    switch (dateRange) {
      case '7d':
        return dailySales.filter(s => {
          const d = parseISO(s.date);
          return d >= subDays(now, 7);
        });
      case '30d':
        return dailySales.filter(s => {
          const d = parseISO(s.date);
          return d >= subDays(now, 30);
        });
      case 'month':
        return dailySales.filter(s => {
          const d = parseISO(s.date);
          return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
        });
      case 'all':
      default:
        return dailySales;
    }
  })();

  // Sort filtered sales descending for table
  const sortedSales = [...filteredSales].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Chart data (ascending for chart)
  const chartData = [...filteredSales].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ).map(s => ({
    date: format(parseISO(s.date), 'MMM dd'),
    revenue: s.total_revenue || 0,
    orders: s.total_orders || 0,
    customers: s.total_customers || 0,
  }));

  // Get sales records to display (with pagination)
  const displayedSales = sortedSales.slice(0, displayedItemsCount);
  const hasMoreSales = sortedSales.length > displayedItemsCount;

  // Reset displayed items when itemsPerPage changes
  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
  }, [itemsPerPage]);

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(sortedSales.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
    document.querySelector('[data-sales-table-container]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('daily_sales')
        .insert({
          date: formData.date,
          total_revenue: parseFloat(formData.total_revenue),
          total_orders: parseInt(formData.total_orders),
          total_customers: parseInt(formData.total_customers)
        });

      if (error) throw error;

      toast({ title: "Success", description: "Daily sales record added successfully" });
      setIsAddDialogOpen(false);
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), total_revenue: '', total_orders: '', total_customers: '' });
      refetch();
    } catch (error) {
      console.error('Error adding daily sales:', error);
      toast({ title: "Error", description: "Failed to add daily sales record", variant: "destructive" });
    }
  };

  const handleEdit = (sale: any) => {
    setEditingDate(sale.date);
    setFormData({
      date: sale.date,
      total_revenue: sale.total_revenue?.toString() || '',
      total_orders: sale.total_orders?.toString() || '',
      total_customers: sale.total_customers?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDate) return;

    try {
      const { error } = await supabase
        .from('daily_sales')
        .update({
          total_revenue: parseFloat(formData.total_revenue),
          total_orders: parseInt(formData.total_orders),
          total_customers: parseInt(formData.total_customers),
        })
        .eq('date', editingDate);

      if (error) throw error;

      toast({ title: "Success", description: "Daily sales record updated successfully" });
      setIsEditDialogOpen(false);
      setEditingDate(null);
      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), total_revenue: '', total_orders: '', total_customers: '' });
      refetch();
    } catch (error) {
      console.error('Error updating daily sales:', error);
      toast({ title: "Error", description: "Failed to update daily sales record", variant: "destructive" });
    }
  };

  const handleDelete = async (date: string) => {
    if (!confirm('Are you sure you want to delete this sales record?')) return;

    try {
      const { error } = await supabase.from('daily_sales').delete().eq('date', date);
      if (error) throw error;
      toast({ title: "Success", description: "Daily sales record deleted successfully" });
      refetch();
    } catch (error) {
      console.error('Error deleting daily sales:', error);
      toast({ title: "Error", description: "Failed to delete daily sales record", variant: "destructive" });
    }
  };

  // Force re-sync daily sales from orders
  const handleResync = async () => {
    setIsSyncing(true);
    try {
      // Fetch all completed orders grouped by date
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, amount, user_id, status')
        .in('status', ['processing', 'packed', 'shipped', 'delivered']);

      if (error) throw error;

      // Group by date
      const dailyMap: Record<string, { revenue: number; orders: number; customers: Set<string> }> = {};
      orders?.forEach(order => {
        const date = format(new Date(order.created_at), 'yyyy-MM-dd');
        if (!dailyMap[date]) {
          dailyMap[date] = { revenue: 0, orders: 0, customers: new Set() };
        }
        dailyMap[date].revenue += Number(order.amount) || 0;
        dailyMap[date].orders += 1;
        if (order.user_id) dailyMap[date].customers.add(order.user_id);
      });

      // Upsert each date
      for (const [date, data] of Object.entries(dailyMap)) {
        await supabase
          .from('daily_sales')
          .upsert({
            date,
            total_revenue: data.revenue,
            total_orders: data.orders,
            total_customers: data.customers.size,
          }, { onConflict: 'date' });
      }

      toast({ title: "Synced!", description: `Re-synced ${Object.keys(dailyMap).length} days from orders data` });
      refetch();
    } catch (error) {
      console.error('Error syncing:', error);
      toast({ title: "Error", description: "Failed to re-sync daily sales", variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const calculateTotals = () => {
    if (!filteredSales.length) return { revenue: 0, orders: 0, customers: 0 };
    return filteredSales.reduce((acc, sale) => ({
      revenue: acc.revenue + (sale.total_revenue || 0),
      orders: acc.orders + (sale.total_orders || 0),
      customers: acc.customers + (sale.total_customers || 0)
    }), { revenue: 0, orders: 0, customers: 0 });
  };

  const totals = calculateTotals();
  const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0;

  // Compute trend (compare last 7 days vs previous 7 days)
  const computeTrend = () => {
    if (!dailySales || dailySales.length < 2) return { revenueChange: 0, ordersChange: 0 };
    const now = new Date();
    const last7 = dailySales.filter(s => parseISO(s.date) >= subDays(now, 7));
    const prev7 = dailySales.filter(s => {
      const d = parseISO(s.date);
      return d >= subDays(now, 14) && d < subDays(now, 7);
    });

    const lastRev = last7.reduce((s, d) => s + (d.total_revenue || 0), 0);
    const prevRev = prev7.reduce((s, d) => s + (d.total_revenue || 0), 0);
    const revenueChange = prevRev > 0 ? ((lastRev - prevRev) / prevRev) * 100 : lastRev > 0 ? 100 : 0;

    const lastOrd = last7.reduce((s, d) => s + (d.total_orders || 0), 0);
    const prevOrd = prev7.reduce((s, d) => s + (d.total_orders || 0), 0);
    const ordersChange = prevOrd > 0 ? ((lastOrd - prevOrd) / prevOrd) * 100 : lastOrd > 0 ? 100 : 0;

    return { revenueChange, ordersChange };
  };

  const trend = computeTrend();

  // Today's stats
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySales = dailySales?.find(s => s.date === todayStr);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Daily Sales</h1>
            <p className="text-muted-foreground">Auto-synced from orders · Manual entry also available</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleResync} disabled={isSyncing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Re-sync'}
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add Manual</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Daily Sales Record</DialogTitle>
                  <DialogDescription>Manually enter sales data for a specific date</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_revenue">Total Revenue (KSH)</Label>
                      <Input id="total_revenue" name="total_revenue" type="number" step="0.01" placeholder="0.00" value={formData.total_revenue} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_orders">Total Orders</Label>
                      <Input id="total_orders" name="total_orders" type="number" placeholder="0" value={formData.total_orders} onChange={handleInputChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total_customers">Total Customers</Label>
                      <Input id="total_customers" name="total_customers" type="number" placeholder="0" value={formData.total_customers} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Add Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Auto-sync Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Auto-sync enabled</span>
              <span className="text-sm text-muted-foreground">
                — Daily sales are automatically updated when orders are paid (processing, packed, shipped, delivered)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Live Stats */}
        {todaySales && (
          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-700 gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Today
                </Badge>
                <span className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMM dd yyyy')}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-xl font-bold">KSH {(todaySales.total_revenue || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Orders</p>
                  <p className="text-xl font-bold">{todaySales.total_orders || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customers</p>
                  <p className="text-xl font-bold">{todaySales.total_customers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSH {totals.revenue.toLocaleString()}</div>
              {trend.revenueChange !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {trend.revenueChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${trend.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend.revenueChange >= 0 ? '+' : ''}{trend.revenueChange.toFixed(1)}% vs prev 7d
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.orders.toLocaleString()}</div>
              {trend.ordersChange !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {trend.ordersChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${trend.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend.ordersChange >= 0 ? '+' : ''}{trend.ordersChange.toFixed(1)}% vs prev 7d
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.customers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">In selected period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KSH {avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <p className="text-xs text-muted-foreground mt-1">Per order average</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Sales Trend</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Select value={chartType} onValueChange={(v) => setChartType(v as any)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="orders">Orders</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No data for selected period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                    formatter={(value: number) => [
                      chartType === 'revenue' ? `KSH ${value.toLocaleString()}` : value.toLocaleString(),
                      chartType.charAt(0).toUpperCase() + chartType.slice(1)
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chartType} 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Daily Sales Record</DialogTitle>
              <DialogDescription>
                Update sales data for {editingDate && format(new Date(editingDate), 'MMM dd, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_total_revenue">Total Revenue (KSH)</Label>
                  <Input id="edit_total_revenue" name="total_revenue" type="number" step="0.01" placeholder="0.00" value={formData.total_revenue} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_total_orders">Total Orders</Label>
                  <Input id="edit_total_orders" name="total_orders" type="number" placeholder="0" value={formData.total_orders} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_total_customers">Total Customers</Label>
                  <Input id="edit_total_customers" name="total_customers" type="number" placeholder="0" value={formData.total_customers} onChange={handleInputChange} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Update Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sales Table */}
        <Card data-sales-table-container>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Sales Records</CardTitle>
                <CardDescription>
                  Showing {displayedSales.length} of {sortedSales.length} records
                  {dateRange !== 'all' && ` (filtered)`}
                </CardDescription>
              </div>
              
              {sortedSales.length > 10 && (
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value) => setItemsPerPage(Number(value))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : sortedSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No sales records found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sales are auto-recorded when orders are paid, or add manually
                </p>
                <Button variant="outline" onClick={handleResync} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Sync from Orders
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Revenue (KSH)</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Customers</TableHead>
                        <TableHead className="text-right">Avg Order Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedSales.map((sale) => (
                        <TableRow key={sale.date} className={sale.date === todayStr ? 'bg-green-500/5' : ''}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {format(new Date(sale.date), 'MMM dd, yyyy')}
                              {sale.date === todayStr && (
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">Today</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(sale.total_revenue || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {sale.total_orders || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {sale.total_customers || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {sale.total_orders 
                              ? ((sale.total_revenue || 0) / sale.total_orders).toLocaleString(undefined, { maximumFractionDigits: 0 })
                              : '0'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(sale)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(sale.date)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                {sortedSales.length > itemsPerPage && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 mt-6 border-t">
                    <div className="flex items-center gap-2">
                      {hasMoreSales && (
                        <>
                          <Button variant="outline" onClick={handleShowMore} className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4" />
                            Show More ({Math.min(itemsPerPage, sortedSales.length - displayedItemsCount)} more)
                          </Button>
                          {sortedSales.length - displayedItemsCount > itemsPerPage && (
                            <Button variant="ghost" onClick={handleShowAll} className="text-primary hover:text-primary/80">
                              Show All ({sortedSales.length})
                            </Button>
                          )}
                        </>
                      )}
                      {!hasMoreSales && displayedItemsCount > itemsPerPage && (
                        <Button variant="outline" onClick={handleShowLess} className="flex items-center gap-2">
                          Show Less
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDailySalesPage;
