import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { format } from 'date-fns';
import { FileText, Download, Settings, Package, ShoppingBag, Search, RefreshCw, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface OrderItem {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  amount: number;
  first_name?: string;
  last_name?: string;
  shipping_address: string | null;
}

const orderStatuses = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"];

// Loading skeleton component for the table
const TableLoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
              <TableHead><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array(5).fill(0).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-8 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </CardContent>
  </Card>
);

// Page loading skeleton
const PageLoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-gray-50/50">
    <main className="flex-grow container py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 w-48" />
      </div>
      
      {/* Status cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 pt-4">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-8" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Search and filter skeleton */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full md:w-40" />
            <Skeleton className="h-10 w-full md:w-24" />
          </div>
        </CardContent>
      </Card>
      
      <TableLoadingSkeleton />
    </main>
  </div>
);

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = isMobileUserAgent();

  const [orderCount, setOrderCount] = useState({ 
    total: 0, 
    pending: 0,
    paid: 0, 
    processing: 0, 
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin');
    }
  }, [user, authLoading, navigate]);

  // Fetch user's orders
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Apply filters whenever search query or status filter changes
  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [searchQuery, statusFilter, orders, loading]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      // Type cast the data to ensure items is properly converted from Json to OrderItem[]
      const typedOrders = data.map(order => ({
        ...order,
        items: order.items ? (order.items as unknown as OrderItem[]) : []
      })) as Order[];
      
      setOrders(typedOrders);
      setFilteredOrders(typedOrders);
      
      // Count orders by status
      const counts = {
        total: typedOrders.length,
        pending: typedOrders.filter(order => order.status === 'pending').length,
        paid: typedOrders.filter(order => order.status === 'paid').length,
        processing: typedOrders.filter(order => order.status === 'processing').length,
        shipped: typedOrders.filter(order => order.status === 'shipped').length,
        delivered: typedOrders.filter(order => order.status === 'delivered').length,
        cancelled: typedOrders.filter(order => order.status === 'cancelled').length
      };
      setOrderCount(counts);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error loading orders",
        description: "There was an error loading your orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...orders];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.order_id.toLowerCase().includes(query) || 
        order.items.some(item => item.name?.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'paid':
        return '📦';
      case 'processing':
        return '⚙️';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  // Show loading skeleton while auth is loading or orders are loading
  if (authLoading || loading) {
    return (
      <>
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader
            title="My Orders"
            backTo="/"
            rightAction={
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}
        <PageLoadingSkeleton />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50/50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title="My Orders"
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      
      <main className="flex-grow container py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-500">Track and manage your orders</p>
            </div>
          </div>
          
          <Button 
            onClick={fetchOrders} 
            variant="outline"
            className="flex items-center gap-2 w-full md:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              When you place an order, you'll be able to track it here. Start shopping to see your order history.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <>
            {/* Order Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{orderCount.total}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{orderCount.pending}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{orderCount.processing + orderCount.paid}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{orderCount.delivered}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Search and Filter Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search orders by ID or product name..." 
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 w-full md:w-auto"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Orders Table */}
            <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  {filteredOrders.length} of {orders.length} orders
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10">
                            <div className="flex flex-col items-center gap-2">
                              <ShoppingBag className="h-8 w-8 text-gray-400" />
                              <p className="text-muted-foreground">No orders found</p>
                              {(searchQuery || statusFilter !== "all") && (
                                <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow 
                            key={order.order_id} 
                            className="cursor-pointer hover:bg-muted/50" 
                            onClick={() => navigate(`/order/${order.order_id}`)}
                          >
                            <TableCell className="font-medium">
                              #{order.order_id.slice(-8).toUpperCase()}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{format(new Date(order.created_at), 'MMM d, yyyy')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {order.items?.length || 0} items
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              Ksh {order.amount?.toLocaleString() || '0'}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(order.status)} border px-3 py-1 font-medium`}>
                                <span className="mr-1">{getStatusIcon(order.status)}</span>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/order/${order.order_id}`);
                                }}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;
