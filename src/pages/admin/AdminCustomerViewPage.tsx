import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, TrendingUp, ShoppingBag, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminCustomerViewPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['admin-customer-profile', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-customer-orders', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin-customer-analytics', customerId],
    queryFn: async () => {
      if (!customerId) throw new Error('Customer ID is required');
      
      const { data: orders } = await supabase
        .from('orders')
        .select('order_id, amount, items, created_at')
        .eq('user_id', customerId);

      if (!orders || orders.length === 0) {
        return {
          totalOrders: 0,
          lifetimeValue: 0,
          averageOrderValue: 0,
          lastOrderDate: null,
          topCategories: [],
          orderFrequency: 0,
        };
      }

      const totalOrders = orders.length;
      const lifetimeValue = orders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
      const averageOrderValue = lifetimeValue / totalOrders;
      const lastOrderDate = orders[0]?.created_at;

      // Calculate order frequency (orders per month)
      const firstOrderDate = new Date(orders[orders.length - 1].created_at);
      const monthsSinceFirst = (new Date().getTime() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      const orderFrequency = monthsSinceFirst > 0 ? totalOrders / monthsSinceFirst : totalOrders;

      // Analyze top categories
      const categoryCount: Record<string, number> = {};
      orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          (order.items as any[]).forEach((item: any) => {
            const category = item.category || 'Uncategorized';
            categoryCount[category] = (categoryCount[category] || 0) + 1;
          });
        }
      });

      const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      return {
        totalOrders,
        lifetimeValue,
        averageOrderValue,
        lastOrderDate,
        topCategories,
        orderFrequency,
      };
    },
    enabled: !!customerId,
  });

  const isLoading = profileLoading || ordersLoading || analyticsLoading;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/supersmartkenyaadmin123/customers')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : 'Customer Profile'}
            </h1>
            <p className="text-muted-foreground mt-1">Detailed customer information and analytics</p>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.lifetimeValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(analytics?.averageOrderValue || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders/Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics?.orderFrequency ? analytics.orderFrequency.toFixed(1) : '0'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
              {(profile?.address || profile?.city || profile?.county) && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    {profile.address && <div>{profile.address}</div>}
                    {profile.city && profile.county && (
                      <div className="text-muted-foreground">
                        {profile.city}, {profile.county}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>{new Date(profile?.created_at || '').toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Order</span>
                  <span>
                    {analytics?.lastOrderDate
                      ? new Date(analytics.lastOrderDate).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Top Categories</h4>
                  {analytics?.topCategories && analytics.topCategories.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.topCategories.map((cat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{cat.category}</span>
                          <Badge variant="secondary">{cat.count} orders</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No purchase history</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order History */}
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tracking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell className="font-mono text-sm">
                          {order.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === 'delivered'
                                ? 'default'
                                : order.status === 'cancelled'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(order.amount) || 0)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {order.tracking_number || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No orders found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
