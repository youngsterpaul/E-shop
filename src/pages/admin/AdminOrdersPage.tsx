import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { QuickActionsBar } from '@/components/admin/QuickActionsBar';
import { ExportButton } from '@/components/admin/ExportButton';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Search, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Order {
  order_id: string;
  email: string | null;
  phone_number: string | null;
  status: string;
  amount: number | null;
  created_at: string;
}

const orderStatuses = ["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled"];

const AdminOrdersPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <QuickActionsBar
        title="Orders"
        onRefresh={fetchOrders}
      />

      <div className="flex justify-end mb-4">
        <ExportButton
          data={filteredOrders}
          filename="orders"
          headers={[
            { key: 'order_id', label: 'Order ID' },
            { key: 'email', label: 'Customer Email' },
            { key: 'phone_number', label: 'Phone' },
            { key: 'amount', label: 'Amount' },
            { key: 'status', label: 'Status' },
            { key: 'created_at', label: 'Date' },
          ]}
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            <div className="text-center py-8">Loading orders...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">{order.order_id}</TableCell>
                      <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{order.email || order.phone_number}</TableCell>
                      <TableCell>KSH {order.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge>{order.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminOrdersPage;
