import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveModal, ResponsiveModalHeader, ResponsiveModalFooter, ResponsiveModalTitle, ResponsiveModalDescription } from '@/components/ui/responsive-modal';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Package, Truck, CheckCircle, XCircle } from 'lucide-react';

interface OrderFulfillmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  onSuccess?: () => void;
}

const orderStatuses = [
  { value: 'pending', label: 'Pending', icon: Package, color: 'text-gray-500' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'text-blue-500' },
  { value: 'packed', label: 'Packed', icon: Package, color: 'text-purple-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'text-orange-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-500' },
];

export const OrderFulfillmentModal = ({ open, onOpenChange, order, onSuccess }: OrderFulfillmentModalProps) => {
  const [status, setStatus] = useState(order?.status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('order-fulfillment', {
        body: {
          orderId: order.order_id,
          status,
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined,
        },
      });
      if (error) throw error;
      toast({
        title: 'Order Updated',
        description: `Order status updated to ${status}. Email notification sent to customer.`,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update order status',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingNumber = () => {
    const prefix = 'SK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTrackingNumber(`${prefix}${timestamp}${random}`);
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-[500px]">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Order Fulfillment</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Update order status and send notification to customer
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="space-y-4 px-4 py-2">
        {/* Order Info */}
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order ID:</span>
            <span className="font-mono font-medium">#{order?.order_id?.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customer:</span>
            <span className="font-medium">{order?.username || order?.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span className="font-medium">KSH {order?.amount?.toLocaleString()}</span>
          </div>
        </div>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="status">Order Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map((statusOption) => {
                const Icon = statusOption.icon;
                return (
                  <SelectItem key={statusOption.value} value={statusOption.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${statusOption.color}`} />
                      <span>{statusOption.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Tracking Number */}
        {(status === 'shipped' || status === 'delivered') && (
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking Number</Label>
            <div className="flex gap-2">
              <Input
                id="tracking"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="flex-1"
              />
              <Button type="button" variant="outline" onClick={generateTrackingNumber} className="shrink-0">
                Generate
              </Button>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes for the customer..."
            rows={3}
          />
        </div>

        {/* Email Preview */}
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            📧 Email notification will be sent to: <strong>{order?.email}</strong>
          </p>
        </div>
      </div>

      <ResponsiveModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update & Notify
            </>
          )}
        </Button>
      </ResponsiveModalFooter>
    </ResponsiveModal>
  );
};
