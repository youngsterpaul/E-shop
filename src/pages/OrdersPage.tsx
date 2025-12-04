import { useEffect, useState, memo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import ReviewButton from '@/components/ReviewButton';
import { useMpesaPayment } from '@/hooks/useMpesaPayment';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  Settings,
  XCircle,
  AlertCircle,
  ChevronDown,
  PackageX,
  CreditCard,
  Loader2,
  X,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface OrderItem {
  id: string;
  product: { id: string; name: string; price: number; image?: string };
  variant_selections?: Record<string, any>;
  quantity: number;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: string;
  amount: number | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  userName?: string;
}

const statusConfig = {
  all: { label: 'All', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  paid: { label: 'Paid', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100' },
  processing: { label: 'Processing', icon: Settings, color: 'text-purple-600', bg: 'bg-purple-100' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  delivered: { label: 'Completed', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const INITIAL_DISPLAY_COUNT = 8;
const LOAD_MORE_COUNT = 8;

const OrdersPage = memo(() => {
  const isMobile = isMobileUserAgent();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { initiatePayment, checkPaymentStatus } = useMpesaPayment();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    message: string;
  }>({ status: 'idle', message: '' });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const typed = (data || []).map((o) => ({
        ...o,
        items: o.items ? (o.items as unknown as OrderItem[]) : [],
      })) as Order[];
      setOrders(typed);
    } catch {
      toast({
        title: 'Error loading orders',
        description: 'There was an error loading your orders.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const statusMatch = activeStatus === 'all' || o.status === activeStatus;
    const searchMatch =
      !searchQuery ||
      o.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some((i) => i.product.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const displayedOrders = filteredOrders.slice(0, displayCount);
  const hasMore = displayedOrders.length < filteredOrders.length;

  // Track payment status with ref to avoid stale closure
  const paymentStatusRef = useRef(paymentStatus);
  useEffect(() => {
    paymentStatusRef.current = paymentStatus;
  }, [paymentStatus]);

  // Handle Pay Now for pending orders
  const handlePayNow = async (order: Order) => {
    if (!profile?.phone) {
      toast({
        title: 'Phone number required',
        description: 'Please update your profile with a phone number to pay.',
        variant: 'destructive',
      });
      return;
    }

    setPayingOrderId(order.order_id);
    setShowPaymentModal(true);
    const processingStatus = { status: 'processing', message: 'Initiating payment...' };
    setPaymentStatus(processingStatus);
    paymentStatusRef.current = processingStatus;

    try {
      const result = await initiatePayment({
        phone: profile.phone,
        amount: order.amount || 0,
        orderId: order.order_id,
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      const waitingStatus = { status: 'waiting', message: 'Check your phone and enter your M-Pesa PIN' };
      setPaymentStatus(waitingStatus);
      paymentStatusRef.current = waitingStatus;

      // Poll for payment status
      const pollPayment = setInterval(async () => {
        if (result.checkoutRequestId) {
          const status = await checkPaymentStatus(result.checkoutRequestId);
          if (status?.status === 'success') {
            const successStatus = { status: 'success', message: 'Payment successful!' };
            setPaymentStatus(successStatus);
            paymentStatusRef.current = successStatus;
            clearInterval(pollPayment);
            setTimeout(() => {
              setShowPaymentModal(false);
              setPayingOrderId(null);
              setPaymentStatus({ status: 'idle', message: '' });
              fetchOrders(); // Refresh orders
            }, 2000);
          } else if (status?.status === 'failed') {
            const failedStatus = { status: 'failed', message: status.result_desc || 'Payment failed' };
            setPaymentStatus(failedStatus);
            paymentStatusRef.current = failedStatus;
            clearInterval(pollPayment);
          }
        }
      }, 1000);

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollPayment);
        if (paymentStatusRef.current.status === 'waiting') {
          setPaymentStatus({ status: 'timeout', message: 'Payment request timed out' });
        }
      }, 60000);
    } catch (error) {
      setPaymentStatus({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Payment failed. Please try again.',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-24 w-80" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6 py-8' : 'px-4 pb-24 pt-4'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground">Track and manage your orders</p>
          </div>
          {!isMobile && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/my-returns')} size="sm">
                <PackageX className="h-4 w-4 mr-1" /> Returns
              </Button>
              <Button variant="outline" onClick={fetchOrders} size="sm">
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-10 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1 mb-6 scrollbar-hide">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const active = activeStatus === key;
            const Icon = cfg.icon;
            return (
              <Button
                key={key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className={`flex-shrink-0 gap-1.5 px-4 ${active ? 'font-medium' : ''}`}
                onClick={() => setActiveStatus(key)}
              >
                <Icon className={`h-4 w-4 ${active ? '' : cfg.color}`} />
                {cfg.label}
              </Button>
            );
          })}
        </div>

        {/* Orders List */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const cfg = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.all;
              const Icon = cfg.icon;
              return (
                <Card key={order.order_id} className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold text-foreground">
                        #{order.order_id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 w-full">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md border"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 text-sm sm:text-base line-clamp-2 min-h-[32px]">
                              {item.product.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              Qty: {item.quantity} × Ksh {item.product.price.toLocaleString()}
                            </p>
                            <p className="font-semibold text-primary text-sm sm:text-base">
                              Ksh {(item.product.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {order.status === 'delivered' && (
                          <ReviewButton
                            productId={item.product.id}
                            productName={item.product.name}
                            size="sm"
                          />
                        )}
                      </div>
                    ))}

                    <div className="border-t pt-3 space-y-2">
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="flex justify-between text-xs text-green-600">
                          <span>Discount Applied</span>
                          <span>-Ksh {order.discount_amount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total</span>
                        <span className="text-primary font-semibold">
                          Ksh {(order.amount || 0).toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Pay Now button for pending orders */}
                      {order.status === 'pending' && (
                        <Button
                          className="w-full mt-3"
                          onClick={() => handlePayNow(order)}
                          disabled={payingOrderId === order.order_id}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={() => {
                setLoadingMore(true);
                setTimeout(() => {
                  setDisplayCount((p) => p + LOAD_MORE_COUNT);
                  setLoadingMore(false);
                }, 400);
              }}
            >
              {loadingMore ? 'Loading...' : <ChevronDown className="h-4 w-4 mr-1" />}
              Show More
            </Button>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => {
        if (!open && paymentStatus.status !== 'processing' && paymentStatus.status !== 'waiting') {
          setShowPaymentModal(false);
          setPayingOrderId(null);
          setPaymentStatus({ status: 'idle', message: '' });
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              M-Pesa Payment
            </DialogTitle>
            <DialogDescription>
              {payingOrderId && `Order #${payingOrderId.slice(-8).toUpperCase()}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 text-center">
            {paymentStatus.status === 'processing' && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Initiating payment...</p>
              </div>
            )}
            
            {paymentStatus.status === 'waiting' && (
              <div className="space-y-4">
                <div className="relative">
                  <Progress value={50} className="h-2" />
                </div>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="font-medium">Check your phone</p>
                <p className="text-sm text-muted-foreground">{paymentStatus.message}</p>
              </div>
            )}
            
            {paymentStatus.status === 'success' && (
              <div className="space-y-4">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                <p className="font-medium text-green-600">Payment Successful!</p>
              </div>
            )}
            
            {(paymentStatus.status === 'failed' || paymentStatus.status === 'timeout') && (
              <div className="space-y-4">
                <XCircle className="h-12 w-12 mx-auto text-red-500" />
                <p className="font-medium text-red-600">
                  {paymentStatus.status === 'timeout' ? 'Payment Timed Out' : 'Payment Failed'}
                </p>
                <p className="text-sm text-muted-foreground">{paymentStatus.message}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingOrderId(null);
                    setPaymentStatus({ status: 'idle', message: '' });
                  }}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default OrdersPage;
