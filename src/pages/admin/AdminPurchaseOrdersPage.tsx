import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, FileText, CheckCircle, Clock, XCircle, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  total_amount: number;
  created_at: string;
  suppliers: { name: string } | null;
}

const AdminPurchaseOrdersPage = () => {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: purchaseOrders, isLoading, refetch } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers:supplier_id (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const filteredOrders = purchaseOrders?.filter(order =>
    statusFilter === 'all' || order.status === statusFilter
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'outline';
      case 'sent':
        return 'secondary';
      case 'confirmed':
        return 'default';
      case 'received':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return FileText;
      case 'sent':
        return Clock;
      case 'confirmed':
        return CheckCircle;
      case 'received':
        return Package;
      case 'cancelled':
        return XCircle;
      default:
        return FileText;
    }
  };

  const stats = {
    draft: purchaseOrders?.filter(po => po.status === 'draft').length || 0,
    sent: purchaseOrders?.filter(po => po.status === 'sent').length || 0,
    confirmed: purchaseOrders?.filter(po => po.status === 'confirmed').length || 0,
    received: purchaseOrders?.filter(po => po.status === 'received').length || 0,
  };

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Purchase Orders"
        onRefresh={refetch}
        addNewPath="/supersmartkenyaadmin123/purchase-orders/create"
        addNewLabel="Create PO"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Draft</div>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Sent</div>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Confirmed</div>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground mb-1">Received</div>
            <div className="text-2xl font-bold">{stats.received}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No purchase orders found</h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== 'all'
                  ? 'Try adjusting your filter'
                  : 'Create your first purchase order to get started'}
              </p>
              <Link to="/supersmartkenyaadmin123/purchase-orders/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status);

                return (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{order.po_number}</h3>
                            <Badge variant={getStatusColor(order.status)} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {order.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Supplier:</span>{' '}
                              {order.suppliers?.name || 'N/A'}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span>{' '}
                              KSH {order.total_amount.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Order Date:</span>{' '}
                              {format(new Date(order.order_date), 'MMM dd, yyyy')}
                            </div>
                            {order.expected_delivery_date && (
                              <div>
                                <span className="font-medium">Expected:</span>{' '}
                                {format(new Date(order.expected_delivery_date), 'MMM dd, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <Link to={`/supersmartkenyaadmin123/purchase-orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminPurchaseOrdersPage;
