import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Search, Eye, FileUp, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { downloadReceipt } from '@/utils/receiptGenerator';

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
  amount: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
}

const orderStatuses = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderCount, setOrderCount] = useState({ 
    total: 0, 
    pending: 0, 
    processing: 0, 
    shipped: 0,
    delivered: 0,
    cancelled: 0
  });
  
  // Fetch orders on initial load
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Apply filters whenever search query or status filter changes
  useEffect(() => {
    if (!loading) {
      applyFilters();
    }
  }, [searchQuery, statusFilter, orders]);
  
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        // Convert Json items to OrderItem[] type
        const typedOrders: Order[] = data.map(order => ({
          ...order,
          items: order.items ? (order.items as unknown as OrderItem[]) : null,
          mpesa_checkout_request_id: order.mpesa_checkout_request_id || undefined,
          actual_delivery_date: order.actual_delivery_date || undefined,
          amount: order.amount || 0,
          coupon_code: order.coupon_code || undefined,
          discount_amount: order.discount_amount || 0,
          email: order.email || null,
          first_name: order.first_name || undefined,
          last_name: order.last_name || undefined,
          phone_number: order.phone_number || null,
          shipping_address: order.shipping_address || null,
          tracking_number: order.tracking_number || undefined,
          username: order.username || undefined,
          estimated_delivery: order.estimated_delivery || undefined,
          payment_id: order.payment_id || undefined
        }));
        
        setOrders(typedOrders);
        setFilteredOrders(typedOrders);
        
        // Count orders by status
        const counts = {
          total: typedOrders.length,
          pending: typedOrders.filter(order => order.status === 'pending').length,
          processing: typedOrders.filter(order => order.status === 'processing').length,
          shipped: typedOrders.filter(order => order.status === 'shipped').length,
          delivered: typedOrders.filter(order => order.status === 'delivered').length,
          cancelled: typedOrders.filter(order => order.status === 'cancelled').length
        };
        setOrderCount(counts);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Failed to fetch orders",
        description: error.message,
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
        order.email?.toLowerCase().includes(query) ||
        order.phone_number?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  };
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setUpdatedStatus(order.status);
    setIsUpdateDialogOpen(true);
  };
  
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: updatedStatus,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', selectedOrder.order_id);
        
      if (error) throw error;
      
      // Update orders in state
      const updatedOrders = orders.map(order => 
        order.order_id === selectedOrder.order_id 
          ? { ...order, status: updatedStatus, updated_at: new Date().toISOString() } 
          : order
      );
      
      setOrders(updatedOrders);
      
      toast({
        title: "Order status updated",
        description: `Order #${selectedOrder.order_id} has been updated to ${updatedStatus}.`,
      });
      
      // Close dialog
      setIsUpdateDialogOpen(false);
      
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Failed to update order status",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDownloadReceipt = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      downloadReceipt(order);
      toast({
        title: "Receipt downloaded",
        description: `Receipt for order #${order.order_id} has been downloaded.`,
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Failed to download receipt",
        description: "There was an error generating the receipt.",
        variant: "destructive"
      });
    }
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'processing':
        return 'bg-primary text-primary-foreground';
      case 'shipped':
        return 'bg-secondary text-secondary-foreground';
      case 'delivered':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-0 md:ml-64 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Orders Management</h1>
            <p className="text-muted-foreground">Manage and update customer orders</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button 
              onClick={fetchOrders} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Order Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
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
              <p className="text-2xl font-bold">{orderCount.processing}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Shipped</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orderCount.shipped}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orderCount.delivered}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orderCount.cancelled}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search orders by ID, email, or phone..." 
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
                className="flex items-center gap-2"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0">
            <CardTitle>Order List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-10 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-16 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell><div className="h-5 w-20 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        <TableCell className="text-right"><div className="h-8 w-8 bg-gray-200 rounded-full ml-auto animate-pulse"></div></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        <p className="text-muted-foreground">No orders found</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => (
                      <TableRow key={order.order_id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOrderClick(order)}>
                        <TableCell className="font-medium">{order.order_id}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            {order.email && <div className="text-sm">{order.email}</div>}
                            {order.phone_number && <div className="text-xs text-muted-foreground">{order.phone_number}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{order.items?.length || 0}</TableCell>
                        <TableCell>Ksh {order.amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => handleDownloadReceipt(order, e)}
                              title="Download Receipt"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOrderClick(order);
                              }}
                              title="View Order"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Order Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Order #{selectedOrder?.order_id}</DialogTitle>
            <DialogDescription>
              View order details and update status
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p>{selectedOrder.email || 'N/A'}</p>
                  <p>{selectedOrder.phone_number || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date & Amount</p>
                  <p>{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                  <p className="font-medium">Ksh {selectedOrder.amount?.toLocaleString() || 0}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
                <p>{selectedOrder.shipping_address || 'No address provided'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <p>Qty: {item.quantity}</p>
                          <p>Ksh {item.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Update Status</p>
                <Select value={updatedStatus} onValueChange={setUpdatedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleDownloadReceipt(selectedOrder, new Event('click') as unknown as React.MouseEvent)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90" 
              onClick={handleStatusUpdate}
              disabled={isUpdating || !selectedOrder || selectedOrder.status === updatedStatus}
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrdersPage;
