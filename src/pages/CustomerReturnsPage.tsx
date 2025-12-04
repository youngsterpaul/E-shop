import { useState } from 'react';
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
import { PackageX, ArrowLeft, Calendar, Package, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Order {
  order_id: string;
  created_at: string;
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

const statusColors = {
  pending: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
  processing: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-700 border-green-500/20'
};

export default function CustomerReturnsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    enabled: !!user?.id
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
    enabled: !!user?.id
  });

  const handleSubmitReturn = async () => {
    if (!selectedOrder || !returnReason.trim() || selectedItems.length === 0) {
      toast.error('Please select items and provide a reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: returnNumber, error: fnError } = await supabase
        .rpc('generate_return_number');

      if (fnError) throw fnError;

      const returnItems = selectedOrder.items.filter(item => 
        selectedItems.includes(item.id || item.product.id)
      );

      const { error } = await supabase
        .from('returns')
        .insert({
          return_number: returnNumber,
          order_id: selectedOrder.order_id,
          user_id: user?.id,
          status: 'pending',
          return_reason: returnReason,
          items: returnItems,
          refund_amount: returnItems.reduce((sum, item) => 
            sum + (item.product.price * item.quantity), 0
          )
        });

      if (error) throw error;

      toast.success('Return request submitted successfully');
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/orders')}
            className="mb-4 -ml-2"
          >
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
                <p className="text-muted-foreground">You can return items within 7 days of delivery. Items must be in original condition with tags attached.</p>
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
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No delivered orders available for return</p>
                </div>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <PackageX className="h-4 w-4 mr-2" />
                      Start Return Process
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Return Request</DialogTitle>
                      <DialogDescription>
                        Select an order and items to return
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div>
                        <Label>Select Order</Label>
                        <Select 
                          value={selectedOrder?.order_id || undefined} 
                          onValueChange={(orderId) => {
                            const order = orders.find(o => o.order_id === orderId);
                            setSelectedOrder(order || null);
                            setSelectedItems([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose an order" />
                          </SelectTrigger>
                          <SelectContent>
                            {orders.map((order) => (
                              <SelectItem key={order.order_id} value={order.order_id}>
                                Order #{order.order_id.slice(0, 8)} - KES {order.amount?.toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedOrder && (
                        <>
                          <div>
                            <Label>Select Items to Return</Label>
                            <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                              {selectedOrder.items.map((item: any, idx: number) => {
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
                                      setSelectedItems(prev =>
                                        prev.includes(itemId)
                                          ? prev.filter(id => id !== itemId)
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
                          </div>

                          <div>
                            <Label>Reason for Return</Label>
                            <Textarea
                              placeholder="Please describe why you're returning these items..."
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              className="min-h-24"
                            />
                          </div>

                          <Button
                            onClick={handleSubmitReturn}
                            disabled={isSubmitting || selectedItems.length === 0 || !returnReason.trim()}
                            className="w-full"
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
                          </Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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
                          <p className="text-xs text-muted-foreground">
                            Order: {returnItem.order_id.slice(0, 8)}...
                          </p>
                        </div>
                        <Badge className={statusColors[returnItem.status as keyof typeof statusColors]}>
                          {returnItem.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {returnItem.return_reason}
                      </p>

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
