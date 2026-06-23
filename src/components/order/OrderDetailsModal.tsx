import { useEffect, useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { supabase } from '@/integrations/supabase/client';
import { ClipboardList, Loader2, Sparkles } from 'lucide-react';
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

// Modern fashion distribution hub location
const DEFAULT_LOCATION = 'Gem Fashion Fulfillment Hub';

// Refreshed status messages tailored for an upscale, premium fashion brand
const buildEventDetails = (status: string, isLatest: boolean) => {
  switch (status) {
    case 'pending':
      return {
        title: 'Order Received',
        description:
          'Thank you for choosing Gem Fashion Style. Your order details are being verified before runway-ready preparation.',
      };
    case 'processing':
      return {
        title: 'Curating & Selecting Items',
        description: isLatest
          ? 'Our fashion concierges are pulling your selected pieces from our exclusive collections.'
          : 'Order preparation initialized at our central curation center.',
      };
    case 'packed':
      return {
        title: 'Beautifully Packaged & Prepared',
        description:
          'Your items have been carefully inspected, premium wrapped, and sealed in custom Gem Fashion Style packaging.',
      };
    case 'shipped':
      return {
        title: 'Dispatched via Premium Courier',
        description: isLatest
          ? 'Your wardrobe additions are in transit and making their way to your location.'
          : 'Parcel sorted and picked up by our premium logistics network.',
      };
    case 'delivered':
      return {
        title: 'Delivered in Style',
        description:
          'Your curated Gem Fashion Style delivery is complete. Enjoy your new look!',
      };
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        description:
          'This order has been cancelled. For assistance styling your next look, contact our support team.',
      };
    default:
      return {
        title: 'Wardrobe Update',
        description: 'Your order milestone has updated.',
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md border-zinc-100 shadow-2xl rounded-2xl">
      <ResponsiveModalHeader className="border-b border-zinc-100 pb-4 bg-zinc-50/50 rounded-t-2xl px-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-rose-500 fill-rose-100" />
          <span className="text-xs uppercase tracking-widest font-semibold text-rose-600">Gem Fashion Style</span>
        </div>
        <ResponsiveModalTitle className="text-xl font-serif font-semibold tracking-tight text-zinc-900">
          Order #{orderId.slice(-8).toUpperCase()}
        </ResponsiveModalTitle>
        <ResponsiveModalDescription className="text-xs text-zinc-500 font-medium tracking-wide">
          Placed {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="px-6 py-6 bg-white rounded-b-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
          </div>
        ) : (
          <div className="relative pl-2">
            {/* Elegant tracking vertical path line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[1.5px] bg-zinc-100" />

            <div className="space-y-6">
              {events.map((event, idx) => {
                const isLatest = idx === 0;
                const isOrdered = event.status === 'pending' && idx === events.length - 1;
                const details = buildEventDetails(event.status, isLatest);
                const date = new Date(event.at);

                return (
                  <div key={`${event.status}-${event.at}`} className="relative flex gap-4 transition-all duration-300">
                    {/* Modern Timeline Node */}
                    <div className="relative z-10 shrink-0">
                      {isOrdered ? (
                        <div className="w-6 h-6 rounded-full bg-zinc-50 flex items-center justify-center ring-4 ring-white border border-zinc-200">
                          <ClipboardList className="h-3 w-3 text-zinc-500" />
                        </div>
                      ) : (
                        <div
                          className={`w-3 h-3 rounded-full mt-1.5 ml-1.5 ring-4 ring-white transition-all duration-300 ${
                            isLatest 
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] scale-110' 
                              : 'bg-zinc-300'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 pb-1">
                      {isOrdered ? (
                        <p className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">
                          Journey Started
                        </p>
                      ) : null}
                      <p
                        className={`text-sm leading-snug tracking-tight ${
                          isLatest 
                            ? 'text-zinc-900 font-semibold' 
                            : 'text-zinc-600 font-medium'
                        }`}
                      >
                        {details.title}
                      </p>
                      {details.description && (
                        <p className="text-xs text-zinc-500 mt-1 leading-relaxed font-normal">
                          {details.description}
                        </p>
                      )}
                      
                      {/* Fashion Hub Meta tag */}
                      <p className="text-[11px] text-zinc-400 mt-2 font-medium flex items-center gap-1.5">
                        <span>{format(date, 'MMM d, yyyy')}</span>
                        <span className="text-zinc-300">•</span>
                        <span>{format(date, 'HH:mm')}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-rose-600/80 tracking-wide font-normal">{DEFAULT_LOCATION}</span>
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