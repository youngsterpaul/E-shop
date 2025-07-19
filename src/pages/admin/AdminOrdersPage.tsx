
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
import { Search, Eye, RefreshCw, FileText, Package, ShoppingBag, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { downloadReceipt } from '@/utils/receiptGenerator';

// Updated interface to match OrderDetailPage structure
interface OrderItem {
  id?: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  variant_selections?: Record<string, any>;
  quantity: number;
  // Legacy fields for backward compatibility
  product_id?: string;
  name?: string;
  price?: number;
  image?: string;
}

// Legacy interface for receipt generation
interface LegacyOrderItem {
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
  first_name?: string;
  last_name?: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
}

const orderStatuses = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"];

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

  // Function to normalize order items for display
  const normalizeOrderItem = (item: any): OrderItem => {
    // If it's already in the new format
    if (item.product && typeof item.product === 'object') {
      return item;
    }
    
    // Convert legacy format to new format
    return {
      id: item.product_id || item.id,
      product: {
        id: item.product_id || item.id || '',
        name: item.name || '',
        price: item.price || 0,
        image: item.image
      },
      variant_selections: item.variant_selections,
      quantity: item.quantity || 0
    };
  };

  // Function to display variant selections
  const renderVariantSelections = (variant_selections?: Record<string, any>) => {
    if (!variant_selections || Object.keys(variant_selections).length === 0) {
      return null;
    }

    return (
      <div className="text-xs text-gray-500 mt-1">
        {Object.entries(variant_selections).map(([key, value], index) => (
          <span key={key}>
            {key}: {value}
            {index < Object.entries(variant_selections).length - 1 && ', '}
          </span>
        ))}
      </div>
    );
  };
  
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
  
  const handleDownloadReceipt = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      // Transform the order to match the expected structure for downloadReceipt (legacy format)
      const transformedOrder = {
        ...order,
        items: order.items?.map(item => {
          const normalizedItem = normalizeOrderItem(item);
          return {
            product_id: normalizedItem.product.id,
            quantity: normalizedItem.quantity,
            name: normalizedItem.product.name,
            price: normalizedItem.product.price,
            image: normalizedItem.product.image
          } as LegacyOrderItem;
        }) || null
      };

      downloadReceipt(transformedOrder);
      toast({
        title: "Receipt downloaded",
        description: `Receipt for order #${order.order_id.slice(-8).toUpperCase()} has been downloaded.`,
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
                        <TableCell className="font-medium">#{order.order_id.slice(-8).toUpperCase()}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>
                          <div>
                            {order.first_name && order.last_name && (
                              <div className="text-sm font-medium">{order.first_name} {order.last_name}</div>
                            )}
                            {order.email && <div className="text-sm">{order.email}</div>}
                            {order.phone_number && <div className="text-xs text-muted-foreground">{order.phone_number}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {order.items?.length || 0} items
                          </Badge>
                        </TableCell>
                        <TableCell>Ksh {order.amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(order.status)} border px-3 py-1 font-medium`}>
                            <span className="mr-1">{getStatusIcon(order.status)}</span>
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
      
      {/* Enhanced Order Update Dialog - Similar to OrderDetailPage */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Order #{selectedOrder?.order_id.slice(-8).toUpperCase()}
                </DialogTitle>
                <DialogDescription className="flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-2" />
                  Placed on {selectedOrder && format(new Date(selectedOrder.created_at), 'PPP')}
                </DialogDescription>
              </div>
              <div className="ml-auto">
                <Badge className={`${selectedOrder && getStatusColor(selectedOrder.status)} border px-4 py-2 font-medium`}>
                  <span className="mr-2">{selectedOrder && getStatusIcon(selectedOrder.status)}</span>
                  {selectedOrder && selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </Badge>
              </div>
            </div>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Customer and Shipping Information */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                  </div>
                  <div className="pl-8">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedOrder.shipping_address || 'No shipping address provided'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Contact Information</h3>
                  </div>
                  <div className="pl-8 space-y-2">
                    {selectedOrder.first_name && selectedOrder.last_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">👤</span>
                        <p className="text-gray-700">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                      </div>
                    )}
                    {selectedOrder.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-700">{selectedOrder.email}</p>
                      </div>
                    )}
                    {selectedOrder.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-700">{selectedOrder.phone_number}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Items - Enhanced Display */}
              <div className="bg-white border rounded-lg">
                <div className="flex items-center gap-3 p-6 border-b">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  <h3 className="text-xl font-semibold text-gray-900">Order Items</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {selectedOrder.items?.length || 0} items
                  </Badge>
                </div>
                
                <div className="p-6">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    <div className="space-y-6">
                      <div className="divide-y divide-gray-100">
                        {selectedOrder.items.map((item, i) => {
                          const normalizedItem = normalizeOrderItem(item);
                          return (
                            <div key={i} className="flex py-6 items-center justify-between first:pt-0 last:pb-0">
                              <div className="flex items-center flex-1">
                                {normalizedItem.product.image ? (
                                  <img 
                                    src={normalizedItem.product.image} 
                                    alt={normalizedItem.product.name}
                                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                    <Package className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                                
                                <div className="ml-6 flex-1">
                                  <h4 className="font-semibold text-gray-900 text-lg mb-1">{normalizedItem.product.name}</h4>
                                  {renderVariantSelections(normalizedItem.variant_selections)}
                                  <p className="text-gray-500 mb-3">Quantity: {normalizedItem.quantity}</p>
                                  <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">
                                      Ksh {(normalizedItem.product.price || 0).toLocaleString()} each
                                    </p>
                                    <p className="text-lg font-bold text-primary">
                                      Total: Ksh {((normalizedItem.product.price || 0) * (normalizedItem.quantity || 0)).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Total Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                          <div>
                            <p className="text-gray-500 mb-1">Total Amount</p>
                            <p className="text-sm text-gray-500">
                              {selectedOrder.items?.length || 0} items
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-900">
                            Ksh {(selectedOrder.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
                      <p className="text-gray-500">No items found in this order</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Status Update Section */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Order Status</h3>
                <Select value={updatedStatus} onValueChange={setUpdatedStatus}>
                  <SelectTrigger className="max-w-xs">
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
            </div>
          )}
          
          <DialogFooter className="border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => selectedOrder && handleDownloadReceipt(selectedOrder)}
              className="mr-auto"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
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