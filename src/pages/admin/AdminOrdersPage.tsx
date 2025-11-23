import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { OrderFulfillmentModal } from '@/components/admin/OrderFulfillmentModal';
import { DebouncedSearchInput } from '@/components/admin/DebouncedSearchInput';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Eye, Truck, Package, CheckCircle, XCircle, Download, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { downloadReceipt } from '@/utils/receiptGenerator';

interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
  variant_selections?: Record<string, any>;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number: string | null;
  status: string;
  amount: number | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  items: OrderItem[] | null;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_receipt_number?: string | null;
}

const orderStatuses = ["all", "pending", "processing", "packed", "shipped", "delivered", "cancelled"];

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(50);
  const itemsPerPage = 50;
  const [fulfillmentModal, setFulfillmentModal] = useState<{ open: boolean; order: any }>({
    open: false,
    order: null,
  });
  const [viewOrderModal, setViewOrderModal] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null,
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        mpesa_payments!left(mpesa_receipt_number)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } else {
      setOrders((data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[] | null,
        username: order.username ?? undefined,
        mpesa_receipt_number: (order.mpesa_payments as any)?.[0]?.mpesa_receipt_number || null,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const displayedOrders = filteredOrders.slice(0, displayedItemsCount);
  const hasMoreOrders = filteredOrders.length > displayedItemsCount;

  useEffect(() => {
    setDisplayedItemsCount(itemsPerPage);
    setSelectedOrders([]);
    setIsAllSelected(false);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const handleShowMore = () => {
    setDisplayedItemsCount(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setDisplayedItemsCount(filteredOrders.length);
  };

  const handleShowLess = () => {
    setDisplayedItemsCount(itemsPerPage);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
      setIsAllSelected(false);
    } else {
      setSelectedOrders(displayedOrders.map(o => o.order_id));
      setIsAllSelected(true);
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .in('order_id', selectedOrders);

      if (error) throw error;

      toast({ title: "Success", description: `${selectedOrders.length} orders deleted` });
      setSelectedOrders([]);
      setIsAllSelected(false);
      setIsDeleteDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete orders", variant: "destructive" });
    }
  };

  const handleDownloadReceipt = (order: Order) => {
    try {
      downloadReceipt(order);
      toast({ title: "Success", description: "Receipt downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download receipt", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'packed':
        return 'outline';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return CheckCircle;
      case 'shipped':
        return Truck;
      case 'packed':
      case 'processing':
        return Package;
      case 'cancelled':
        return XCircle;
      default:
        return Package;
    }
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Orders"
        onRefresh={fetchOrders}
      />

      {selectedOrders.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedOrders.length}
          totalCount={displayedOrders.length}
          onSelectAll={handleSelectAll}
          onDeselectAll={() => {
            setSelectedOrders([]);
            setIsAllSelected(false);
          }}
          onDelete={() => setIsDeleteDialogOpen(true)}
        />
      )}

      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredOrders}
          filename="orders"
          headers={[
            { key: 'order_id', label: 'Order ID' },
            { key: 'username', label: 'Customer Name' },
            { key: 'email', label: 'Customer Email' },
            { key: 'phone_number', label: 'Phone' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'mpesa_receipt_number', label: 'Transaction Code' },
            { key: 'tracking_number', label: 'Tracking Number' },
            { key: 'created_at', label: 'Date' },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <DebouncedSearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search orders..."
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Orders will appear here once customers place them'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction Code</TableHead>
                      <TableHead>Tracking</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedOrders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status);
                      return (
                        <TableRow key={order.order_id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedOrders.includes(order.order_id)}
                              onCheckedChange={() => handleSelectOrder(order.order_id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono">
                            #{order.order_id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {order.username || order.email}
                              </span>
                              {order.username && order.email && (
                                <span className="text-xs text-muted-foreground">
                                  {order.email}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {order.items && order.items.length > 0 ? (
                                <>
                                  <span className="text-xs font-medium">
                                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                                  </span>
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {order.items.map(item => item.product.name).join(', ')}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-muted-foreground">No items</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            KSH {order.amount?.toLocaleString() || '0'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(order.status)} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {order.mpesa_receipt_number ? (
                              <span className="text-xs font-mono text-primary">
                                {order.mpesa_receipt_number}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.tracking_number ? (
                              <span className="text-xs font-mono text-muted-foreground">
                                {order.tracking_number}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReceipt(order)}
                                title="Download Receipt"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFulfillmentModal({ open: true, order })}
                              >
                                <Truck className="h-4 w-4 mr-1" />
                                Fulfill
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setViewOrderModal({ open: true, order })}
                                title="View Order Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {filteredOrders.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {displayedItemsCount} of {filteredOrders.length} orders
                  </p>
                  <div className="flex gap-2">
                    {hasMoreOrders && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowMore}
                        >
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Show More ({Math.min(itemsPerPage, filteredOrders.length - displayedItemsCount)})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleShowAll}
                        >
                          Show All ({filteredOrders.length})
                        </Button>
                      </>
                    )}
                    {displayedItemsCount > itemsPerPage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleShowLess}
                      >
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

      <OrderFulfillmentModal
        open={fulfillmentModal.open}
        onOpenChange={(open) => setFulfillmentModal({ open, order: null })}
        order={fulfillmentModal.order}
        onSuccess={fetchOrders}
      />

      {/* Order Details Modal */}
      <Dialog open={viewOrderModal.open} onOpenChange={(open) => !open && setViewOrderModal({ open: false, order: null })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Complete information about order #{viewOrderModal.order?.order_id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {viewOrderModal.order && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order ID</p>
                  <p className="text-sm font-mono">{viewOrderModal.order.order_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(viewOrderModal.order.status)}>
                    {viewOrderModal.order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="text-sm">{format(new Date(viewOrderModal.order.created_at), 'PPP p')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-sm font-semibold">KSH {viewOrderModal.order.amount?.toLocaleString() || '0'}</p>
                </div>
                {viewOrderModal.order.mpesa_receipt_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">M-Pesa Code</p>
                    <p className="text-sm font-mono text-primary">{viewOrderModal.order.mpesa_receipt_number}</p>
                  </div>
                )}
                {viewOrderModal.order.tracking_number && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                    <p className="text-sm font-mono">{viewOrderModal.order.tracking_number}</p>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-sm">{viewOrderModal.order.username || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{viewOrderModal.order.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{viewOrderModal.order.phone_number || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Shipping Address</p>
                    <p className="text-sm">{viewOrderModal.order.shipping_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-3">
                  {viewOrderModal.order.items && viewOrderModal.order.items.length > 0 ? (
                    viewOrderModal.order.items.map((item, index) => (
                      <div key={item.id || index} className="flex gap-4 p-3 border rounded-lg">
                        {item.product.image ? (
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-20 h-20 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity} × KSH {item.product.price.toLocaleString()}
                          </p>
                          {item.variant_selections && Object.keys(item.variant_selections).length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Variants: {Object.entries(item.variant_selections).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            KSH {(item.quantity * item.product.price).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="mx-auto h-12 w-12 mb-2" />
                      <p>No items in this order</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>
                      KSH {((viewOrderModal.order.amount || 0) - (viewOrderModal.order.delivery_fee || 0) + (viewOrderModal.order.discount_amount || 0)).toLocaleString()}
                    </span>
                  </div>
                  {viewOrderModal.order.discount_amount && viewOrderModal.order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-KSH {viewOrderModal.order.discount_amount.toLocaleString()}</span>
                    </div>
                  )}
                  {viewOrderModal.order.delivery_fee && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>KSH {viewOrderModal.order.delivery_fee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>KSH {viewOrderModal.order.amount?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOrderModal({ open: false, order: null })}>
              Close
            </Button>
            {viewOrderModal.order && (
              <Button onClick={() => handleDownloadReceipt(viewOrderModal.order!)}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Orders</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedOrders.length} order(s)? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
