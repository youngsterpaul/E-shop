import { useEffect, useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Loader2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface OrderDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

interface StatusEvent {
  status: string;
  at: string;
  reason?: string | null;
}

// Default warehouse / sorting location used when no metadata is provided
const DEFAULT_LOCATION = 'Nairobi, Kenya';

// Build a rich, descriptive message per status — mirrors AliExpress / J&T style timelines
const buildEventDetails = (status: string, isLatest: boolean) => {
  switch (status) {
    case 'pending':
      return {
        title: 'Order placed',
        description:
          'Your order has been received. Awaiting payment confirmation before warehouse processing begins.',
      };
    case 'processing':
      return {
        title: '[Nairobi Warehouse NO.1] has started the warehouse processing',
        description: isLatest
          ? 'Our team is locating and picking your items from the warehouse shelves.'
          : 'Warehouse staff began preparing your order for packaging.',
      };
    case 'packed':
      return {
        title: 'Your order has been packed at Nairobi Warehouse NO.1',
        description:
          'Items have been securely packaged and labelled. Awaiting handover to the courier for dispatch.',
      };
    case 'shipped':
      return {
        title: 'Package received at Nairobi Sorting Center',
        description: isLatest
          ? 'Your package arrived at the sorting center and is awaiting dispatch for delivery.'
          : 'Package was scanned at the sorting center and queued for last-mile delivery.',
      };
    case 'delivered':
      return {
        title: 'Delivered',
        description:
          'Your package has been successfully delivered. Thanks for shopping with us!',
      };
    case 'cancelled':
      return {
        title: 'Order cancelled',
        description:
          'This order was cancelled. If this was unexpected, please contact our support team.',
      };
    default:
      return {
        title: 'Order update',
        description: 'Status updated.',
      };
  }
};

export const OrderDetailsModal = ({
  open,
  onOpenChange,
  orderId,
  status,
  createdAt,
}: OrderDetailsModalProps) => {
  const [events, setEvents] = useState<StatusEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('order_status_history')
        .select('new_status, changed_at, change_reason')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      if (cancelled) return;

      const history: StatusEvent[] = (data || []).map((row) => ({
        status: row.new_status,
        at: row.changed_at,
        reason: row.change_reason,
      }));

      // Always ensure we have the original "Ordered" event at the bottom
      const hasPending = history.some((e) => e.status === 'pending');
      if (!hasPending) {
        history.push({ status: 'pending', at: createdAt });
      }

      setEvents(history);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, orderId, createdAt]);

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Order #{orderId.slice(-8).toUpperCase()}</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Placed {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="relative pl-2">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

            <div className="space-y-6">
              {events.map((event, idx) => {
                const isLatest = idx === 0;
                const isOrdered = event.status === 'pending' && idx === events.length - 1;
                const details = buildEventDetails(event.status, isLatest);
                const date = new Date(event.at);

                return (
                  <div key={`${event.status}-${event.at}`} className="relative flex gap-4">
                    {/* Dot / icon */}
                    <div className="relative z-10 shrink-0">
                      {isOrdered ? (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-4 ring-background">
                          <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      ) : (
                        <div
                          className={`w-3 h-3 rounded-full mt-1.5 ml-1.5 ring-4 ring-background ${
                            isLatest ? 'bg-primary' : 'bg-muted-foreground/40'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-1">
                      {isOrdered ? (
                        <p className="text-sm font-semibold text-foreground mb-1">Ordered</p>
                      ) : null}
                      <p
                        className={`text-sm leading-snug ${
                          isLatest ? 'text-foreground font-medium' : 'text-foreground'
                        }`}
                      >
                        {details.title}
                      </p>
                      {details.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {details.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {format(date, 'MMM d, yyyy')} at {format(date, 'HH:mm')}
                        {'  '}
                        <span className="ml-1">{DEFAULT_LOCATION}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ResponsiveModal>
  );
};

export default OrderDetailsModal;
