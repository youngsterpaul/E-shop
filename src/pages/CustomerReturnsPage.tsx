import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageX, ArrowLeft, Calendar, Package, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';

interface Order {
  order_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  amount: number;
  items: any[];
  tracking_number: string;
}

interface Return {
  id: string;
  return_number: string;
  order_id: string;
  status: string;
  return_reason: string;
  items: any[];
  refund_amount: number | null;
  created_at: string;
  processed_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
  processing: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-700 border-green-500/20',
};

const RETURN_WINDOW_DAYS = 7;

export default function CustomerReturnsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch delivered orders
  const { data: orders = [] } = useQuery({
    queryKey: ['customer-orders-for-return', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!user?.id,
  });

  // Fetch existing returns
  const { data: returns = [], refetch: refetchReturns } = useQuery({
    queryKey: ['customer-returns', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Return[];
    },
    enabled: !!user?.id,
  });

  // Build a set of item IDs already returned (per order)
  const returnedItemsByOrder = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    returns.forEach((r) => {
      if (!map[r.order_id]) map[r.order_id] = new Set();
      (r.items as any[])?.forEach((item: any) => {
        const itemId = item.id || item.product?.id;
        if (itemId) map[r.order_id].add(itemId);
      });
    });
    return map;
  }, [returns]);

  // Filter orders: only within 7 days and with unreturned items
  const eligibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const deliveryDate = new Date(order.updated_at);
      const daysSince = differenceInDays(new Date(), deliveryDate);
      if (daysSince > RETURN_WINDOW_DAYS) return false;

      // Check if there are any items not yet returned
      const returnedSet = returnedItemsByOrder[order.order_id];
      if (!returnedSet) return true;
      const hasUnreturnedItem = (order.items as any[]).some((item: any) => {
        const itemId = item.id || item.product?.id;
        return !returnedSet.has(itemId);
      });
      return hasUnreturnedItem;
    });
  }, [orders, returnedItemsByOrder]);

  // For the selected order, filter out already-returned items
  const availableItems = useMemo(() => {
    if (!selectedOrder) return [];
    const returnedSet = returnedItemsByOrder[selectedOrder.order_id];
    return (selectedOrder.items as any[]).filter((item: any) => {
      const itemId = item.id || item.product?.id;
      return !returnedSet?.has(itemId);
    });
  }, [selectedOrder, returnedItemsByOrder]);

  const selectedOrderDaysLeft = useMemo(() => {
    if (!selectedOrder) return 0;
    const deliveryDate = new Date(selectedOrder.updated_at);
    return Math.max(0, RETURN_WINDOW_DAYS - differenceInDays(new Date(), deliveryDate));
  }, [selectedOrder]);

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !returnReason.trim() || selectedItems.length === 0) {
      toast.error('Please select items and provide a reason');
      return;
    }

    // Double-check 7-day window
    const deliveryDate = new Date(selectedOrder.updated_at);
    if (differenceInDays(new Date(), deliveryDate) > RETURN_WINDOW_DAYS) {
      toast.error('The 7-day return window has expired for this order');
      return;
    }

    // Double-check no duplicates
    const returnedSet = returnedItemsByOrder[selectedOrder.order_id];
    const alreadyReturned = selectedItems.filter((id) => returnedSet?.has(id));
    if (alreadyReturned.length > 0) {
      toast.error('Some selected items have already been returned');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: returnNumber, error: fnError } = await supabase.rpc('generate_return_number');
      if (fnError) throw fnError;

      const returnItems = (selectedOrder.items as any[]).filter((item: any) =>
        selectedItems.includes(item.id || item.product?.id)
      );

      const { error } = await supabase.from('returns').insert({
        return_number: returnNumber,
        order_id: selectedOrder.order_id,
        user_id: user?.id,
        status: 'pending',
        return_reason: returnReason,
        items: returnItems,
        refund_amount: returnItems.reduce((sum: number, item: any) => sum + (item.product?.price || 0) * (item.quantity || 1), 0),
      });

      if (error) throw error;

      toast.success('Return request submitted successfully');
      setDialogOpen(false);
      setSelectedOrder(null);
      setReturnReason('');
      setSelectedItems([]);
      refetchReturns();
    } catch (error) {
      console.error('Error submitting return:', error);
      toast.error('Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expired orders (past 7 days) for display
  const expiredOrders = orders.filter((order) => {
    const daysSince = differenceInDays(new Date(), new Date(order.updated_at));
    return daysSince > RETURN_WINDOW_DAYS;
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackageX className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Returns & Refunds</h1>
              <p className="text-muted-foreground mt-1">Manage your product returns and track refund status</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-foreground">Return Policy</p>
                <p className="text-muted-foreground">
                  You can return items within <strong>7 days</strong> of delivery. Items must be in original condition with tags attached. Each item can only be returned once.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request New Return */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Request a Return</CardTitle>
            </CardHeader>
            <CardContent>
              {eligibleOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground mb-2">No eligible orders for return</p>
                  <p className="text-xs text-muted-foreground">
                    {expiredOrders.length > 0
                      ? `${expiredOrders.length} order(s) past the 7-day return window`
                      : 'No delivered orders found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {eligibleOrders.length} order(s) eligible for return
                  </p>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" variant="outline">
                        <PackageX className="h-4 w-4 mr-2" />
                        Start Return Process
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Return Request</DialogTitle>
                        <DialogDescription>Select an order and items to return</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label>Select Order</Label>
                          <Select
                            value={selectedOrder?.order_id || undefined}
                            onValueChange={(orderId) => {
                              const order = eligibleOrders.find((o) => o.order_id === orderId);
                              setSelectedOrder(order || null);
                              setSelectedItems([]);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose an order" />
                            </SelectTrigger>
                            <SelectContent>
                              {eligibleOrders.map((order) => {
                                const daysLeft = Math.max(0, RETURN_WINDOW_DAYS - differenceInDays(new Date(), new Date(order.updated_at)));
                                return (
                                  <SelectItem key={order.order_id} value={order.order_id}>
                                    <div className="flex items-center gap-2">
                                      <span>Order #{order.order_id.slice(0, 8)} - KES {order.amount?.toLocaleString()}</span>
                                      <Badge variant="outline" className="text-[10px] ml-1">
                                        {daysLeft}d left
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedOrder && (
                          <>
                            {/* Days remaining warning */}
                            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                              selectedOrderDaysLeft <= 2
                                ? 'bg-red-500/10 text-red-700 border border-red-500/20'
                                : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                            }`}>
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>
                                <strong>{selectedOrderDaysLeft} day(s)</strong> remaining to return items from this order
                                {' '}(delivered {format(new Date(selectedOrder.updated_at), 'MMM dd, yyyy')})
                              </span>
                            </div>

                            <div>
                              <Label>Select Items to Return</Label>
                              {availableItems.length === 0 ? (
                                <div className="flex items-center gap-2 p-4 mt-2 border rounded-lg bg-muted/50">
                                  <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">All items from this order have already been returned.</p>
                                </div>
                              ) : (
                                <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                                  {availableItems.map((item: any, idx: number) => {
                                    const itemId = item.id || item.product?.id || `item-${idx}`;
                                    return (
                                      <div
                                        key={itemId}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                          selectedItems.includes(itemId)
                                            ? 'border-primary bg-primary/5'
                                            : 'hover:border-muted-foreground/30'
                                        }`}
                                        onClick={() => {
                                          setSelectedItems((prev) =>
                                            prev.includes(itemId)
                                              ? prev.filter((id) => id !== itemId)
                                              : [...prev, itemId]
                                          );
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={selectedItems.includes(itemId)}
                                          onChange={() => {}}
                                          className="h-4 w-4"
                                        />
                                        <img
                                          src={item.product?.image || '/placeholder.svg'}
                                          alt={item.product?.name}
                                          className="w-12 h-12 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                          <p className="font-medium text-sm text-foreground">{item.product?.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Qty: {item.quantity} × KES {item.product?.price?.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div>
                              <Label>Reason for Return</Label>
                              <Select value={returnReason.split(':')[0] || undefined} onValueChange={(v) => setReturnReason(v + ': ')}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Defective/Damaged">Defective or Damaged Product</SelectItem>
                                  <SelectItem value="Wrong Item">Wrong Item Received</SelectItem>
                                  <SelectItem value="Not as Described">Product Not as Described</SelectItem>
                                  <SelectItem value="Changed Mind">Changed My Mind</SelectItem>
                                  <SelectItem value="Size/Fit Issue">Size or Fit Issue</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <Textarea
                                placeholder="Additional details about why you're returning..."
                                value={returnReason.includes(': ') ? returnReason.split(': ').slice(1).join(': ') : returnReason}
                                onChange={(e) => {
                                  const prefix = returnReason.split(':')[0];
                                  setReturnReason(prefix ? `${prefix}: ${e.target.value}` : e.target.value);
                                }}
                                className="min-h-20 mt-2"
                              />
                            </div>

                            <Button
                              onClick={handleSubmitReturn}
                              disabled={isSubmitting || selectedItems.length === 0 || !returnReason.trim() || returnReason.trim().endsWith(':')}
                              className="w-full"
                            >
                              {isSubmitting ? 'Submitting...' : `Submit Return (${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''})`}
                            </Button>
                          </>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Returns */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground">Your Returns</CardTitle>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <div className="text-center py-12">
                  <PackageX className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No return requests yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {returns.map((returnItem) => (
                    <div
                      key={returnItem.id}
                      className="p-4 border border-border/50 rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{returnItem.return_number}</p>
                          <p className="text-xs text-muted-foreground">Order: {returnItem.order_id.slice(0, 8)}...</p>
                        </div>
                        <Badge className={statusColors[returnItem.status] || statusColors.pending}>
                          {returnItem.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{returnItem.return_reason}</p>

                      {returnItem.items && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {(returnItem.items as any[]).length} item(s) returned
                        </p>
                      )}

                      {returnItem.refund_amount && (
                        <p className="text-sm font-medium text-green-600">
                          Refund: KES {returnItem.refund_amount.toLocaleString()}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(returnItem.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
