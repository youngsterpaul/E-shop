import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalFooter, ResponsiveModalTitle, ResponsiveModalDescription } from '@/components/ui/responsive-modal';
import { PackageX, ArrowLeft, Calendar, Package, AlertCircle, Clock, ShieldAlert, CheckCircle, RotateCcw, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import SiteBreadcrumb from '@/components/Breadcrumb';

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

const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
  pending: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  approved: { bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
  rejected: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-700 dark:text-red-400', icon: PackageX },
  processing: { bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-700 dark:text-purple-400', icon: RotateCcw },
  completed: { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-700 dark:text-green-400', icon: CheckCircle },
  refunded: { bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', icon: Truck },
};

const RETURN_WINDOW_DAYS = 7;

export default function CustomerReturnsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = isMobileUserAgent();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  const eligibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const deliveryDate = new Date(order.updated_at);
      const daysSince = differenceInDays(new Date(), deliveryDate);
      if (daysSince > RETURN_WINDOW_DAYS) return false;
      const returnedSet = returnedItemsByOrder[order.order_id];
      if (!returnedSet) return true;
      return (order.items as any[]).some((item: any) => {
        const itemId = item.id || item.product?.id;
        return !returnedSet.has(itemId);
      });
    });
  }, [orders, returnedItemsByOrder]);

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
    const deliveryDate = new Date(selectedOrder.updated_at);
    if (differenceInDays(new Date(), deliveryDate) > RETURN_WINDOW_DAYS) {
      toast.error('The 7-day return window has expired for this order');
      return;
    }
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

  const expiredOrders = orders.filter((order) => {
    const daysSince = differenceInDays(new Date(), new Date(order.updated_at));
    return daysSince > RETURN_WINDOW_DAYS;
  });

  const renderReturnForm = () => (
    <div className="space-y-4 px-4 pb-4">
      <div>
        <Label className="text-sm font-medium">Select Order</Label>
        <Select
          value={selectedOrder?.order_id || undefined}
          onValueChange={(orderId) => {
            const order = eligibleOrders.find((o) => o.order_id === orderId);
            setSelectedOrder(order || null);
            setSelectedItems([]);
          }}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Choose an order" />
          </SelectTrigger>
          <SelectContent>
            {eligibleOrders.map((order) => {
              const daysLeft = Math.max(0, RETURN_WINDOW_DAYS - differenceInDays(new Date(), new Date(order.updated_at)));
              return (
                <SelectItem key={order.order_id} value={order.order_id}>
                  <div className="flex items-center gap-2">
                    <span>#{order.order_id.slice(0, 8)} — KES {order.amount?.toLocaleString()}</span>
                    <Badge variant="outline" className={`text-[10px] ${daysLeft <= 2 ? 'border-red-500/30 text-red-600' : ''}`}>
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
          <div className={`flex items-center gap-2.5 p-3 rounded-xl text-sm ${
            selectedOrderDaysLeft <= 2
              ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20'
              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
          }`}>
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              <strong>{selectedOrderDaysLeft} day(s)</strong> left — delivered {format(new Date(selectedOrder.updated_at), 'MMM dd, yyyy')}
            </span>
          </div>

          <div>
            <Label className="text-sm font-medium">Select Items to Return</Label>
            {availableItems.length === 0 ? (
              <div className="flex items-center gap-2 p-4 mt-2 border rounded-xl bg-muted/50">
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">All items already returned.</p>
              </div>
            ) : (
              <div className="space-y-2 mt-2 max-h-52 overflow-y-auto">
                {availableItems.map((item: any, idx: number) => {
                  const itemId = item.id || item.product?.id || `item-${idx}`;
                  const isSelected = selectedItems.includes(itemId);
                  return (
                    <div
                      key={itemId}
                      className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'hover:border-muted-foreground/30 hover:bg-muted/30'
                      }`}
                      onClick={() => {
                        setSelectedItems((prev) =>
                          prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
                        );
                      }}
                    >
                      <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                      }`}>
                        {isSelected && <CheckCircle className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <img
                        src={item.product?.image || '/placeholder.svg'}
                        alt={item.product?.name}
                        className="w-11 h-11 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{item.product?.name}</p>
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
            <Label className="text-sm font-medium">Reason for Return</Label>
            <Select value={returnReason.split(':')[0] || undefined} onValueChange={(v) => setReturnReason(v + ': ')}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Defective/Damaged">Defective or Damaged</SelectItem>
                <SelectItem value="Wrong Item">Wrong Item Received</SelectItem>
                <SelectItem value="Not as Described">Not as Described</SelectItem>
                <SelectItem value="Changed Mind">Changed My Mind</SelectItem>
                <SelectItem value="Size/Fit Issue">Size or Fit Issue</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional details..."
              value={returnReason.includes(': ') ? returnReason.split(': ').slice(1).join(': ') : returnReason}
              onChange={(e) => {
                const prefix = returnReason.split(':')[0];
                setReturnReason(prefix ? `${prefix}: ${e.target.value}` : e.target.value);
              }}
              className="min-h-20 mt-2"
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-4 py-6 pb-24'}`}>
        <SiteBreadcrumb 
          items={[
            { label: 'Home', href: '/' },
            { label: 'Orders', href: '/orders' },
            { label: 'Returns' }
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-3 -ml-2" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Orders
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <PackageX className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Returns & Refunds</h1>
              <p className="text-sm text-muted-foreground">Manage returns and track refund status</p>
            </div>
          </div>
        </div>

        {/* Policy Banner */}
        <Card className="mb-5 border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-3.5">
            <div className="flex gap-2.5">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Return items within <strong className="text-foreground">7 days</strong> of delivery. Items must be in original condition. Each item can only be returned once.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{returns.length}</p>
            <p className="text-xs text-muted-foreground">Total Returns</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{returns.filter(r => r.status === 'pending').length}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{returns.filter(r => ['completed', 'refunded'].includes(r.status)).length}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
        </div>

        <div className={`grid gap-5 ${!isMobile ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1'}`}>
          {/* Request New Return */}
          <Card className={`border-border/50 ${!isMobile ? 'lg:col-span-2' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-primary" />
                Request a Return
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eligibleOrders.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground mb-1">No eligible orders</p>
                  <p className="text-xs text-muted-foreground">
                    {expiredOrders.length > 0
                      ? `${expiredOrders.length} order(s) past the 7-day window`
                      : 'No delivered orders found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">{eligibleOrders.length}</Badge>
                    order(s) eligible for return
                  </div>
                  <Button className="w-full" onClick={() => setDialogOpen(true)}>
                    <PackageX className="h-4 w-4 mr-2" />
                    Start Return Process
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Returns List */}
          <Card className={`border-border/50 ${!isMobile ? 'lg:col-span-3' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-foreground">Your Returns</CardTitle>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <div className="text-center py-10">
                  <PackageX className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No return requests yet</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
                  {returns.map((returnItem) => {
                    const config = statusConfig[returnItem.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <div
                        key={returnItem.id}
                        className="p-3.5 border border-border/50 rounded-xl hover:shadow-sm transition-all hover:border-border"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{returnItem.return_number}</p>
                            <p className="text-xs text-muted-foreground">Order #{returnItem.order_id.slice(0, 8)}</p>
                          </div>
                          <Badge variant="outline" className={`${config.bg} ${config.text} border gap-1 text-xs`}>
                            <StatusIcon className="h-3 w-3" />
                            {returnItem.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{returnItem.return_reason}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(returnItem.created_at), { addSuffix: true })}
                          </div>
                          {returnItem.refund_amount && (
                            <p className="text-sm font-semibold text-green-600">
                              KES {returnItem.refund_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Return Form Modal */}
      <ResponsiveModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className={isMobile ? '' : 'max-w-2xl'}
      >
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Create Return Request</ResponsiveModalTitle>
          <ResponsiveModalDescription>Select an order and items to return</ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {renderReturnForm()}

        <ResponsiveModalFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReturn}
            disabled={isSubmitting || selectedItems.length === 0 || !returnReason.trim() || returnReason.trim().endsWith(':')}
          >
            {isSubmitting ? 'Submitting...' : `Submit Return (${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''})`}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModal>
    </div>
  );
}
