import { useEffect, useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import OrderTrackingTimeline from './OrderTrackingTimeline';
import { Clock, Sparkles, Truck } from 'lucide-react';
import { format, formatDistanceToNow, addHours } from 'date-fns';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

const getSmartMessage = (status: string, createdAt: string, updatedAt?: string) => {
  const baseDate = new Date(updatedAt || createdAt);
  const eta = addHours(baseDate, 3);
  const etaStr = format(eta, 'h:mm a');
  const etaDay = format(eta, 'MMM d');

  switch (status) {
    case 'pending':
      return {
        icon: Clock,
        tone: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        title: 'Awaiting payment',
        message: `Complete your M-Pesa payment to confirm this order. Placed ${formatDistanceToNow(baseDate, { addSuffix: true })}.`,
      };
    case 'processing':
      return {
        icon: Sparkles,
        tone: 'bg-purple-50 text-purple-800 border-purple-200',
        title: 'We\'re preparing your order',
        message: `Your items are being picked from our warehouse. Expected to be packed by ${etaStr} today.`,
      };
    case 'packed':
      return {
        icon: Sparkles,
        tone: 'bg-blue-50 text-blue-800 border-blue-200',
        title: 'Packed and ready to ship',
        message: `Your order is packed and waiting for the courier. Expected dispatch around ${etaStr}.`,
      };
    case 'shipped':
      return {
        icon: Truck,
        tone: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        title: 'On the way',
        message: `Your order is out for delivery. Estimated arrival ${etaStr} (${etaDay}).`,
      };
    case 'cancelled':
      return {
        icon: Clock,
        tone: 'bg-red-50 text-red-800 border-red-200',
        title: 'Order cancelled',
        message: `This order was cancelled ${formatDistanceToNow(baseDate, { addSuffix: true })}. Contact support if this was a mistake.`,
      };
    default:
      return {
        icon: Clock,
        tone: 'bg-muted text-foreground border-border',
        title: 'Order update',
        message: `Last updated ${formatDistanceToNow(baseDate, { addSuffix: true })}.`,
      };
  }
};

export const OrderDetailsModal = ({
  open,
  onOpenChange,
  orderId,
  status,
  createdAt,
  updatedAt,
}: OrderDetailsModalProps) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [open]);

  const smart = getSmartMessage(status, createdAt, updatedAt);
  const Icon = smart.icon;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Order #{orderId.slice(-8).toUpperCase()}</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Placed {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-4 pb-4 space-y-4">
        <div className={`flex gap-3 p-3 rounded-lg border ${smart.tone}`} key={now}>
          <Icon className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{smart.title}</p>
            <p className="text-xs leading-relaxed">{smart.message}</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Tracking progress</p>
          <OrderTrackingTimeline status={status} createdAt={createdAt} />
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default OrderDetailsModal;
