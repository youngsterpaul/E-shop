import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { BulkActionsBar } from '@/components/admin/BulkActionsBar';
import { OrderFulfillmentModal } from '@/components/admin/OrderFulfillmentModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Eye, Truck, Package, CheckCircle, XCircle, Download, Trash2, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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
  first_name?: string;
  last_name?: string;
  username?: string;
  phone_number: string | null;
  status: string;
  amount: number | null;
  delivery_fee: number | null;
  items: OrderItem[] | null;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [displayedItemsCount, setDisplayedItemsCount] = useState(10);
  const [fulfillmentModal, setFulfillmentModal] = useState<{ open: boolean; order: any }>({
    open: false,
    order: null,
  });

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } else {
      setOrders((data || []).map(order => ({
        ...order,
        items: order.items as unknown as OrderItem[] | null,
        username: order.username ?? undefined,
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
            { key: 'tracking_number', label: 'Tracking Number' },
            { key: 'created_at', label: 'Date' },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
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
                              <Button variant="ghost" size="sm">
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
