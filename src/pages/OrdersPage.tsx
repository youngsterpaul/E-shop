import { useEffect, useState, memo } from 'react';
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
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);
  const [loadingMore, setLoadingMore] = useState(false);

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
    <div className={`container min-h-screen bg-gray-50 pb-24 flex-grow mx-auto py-8 ${!isMobile ? 'px-4 xl:px-24' : 'px-2'}`}>
      <div className="bg-gray-50 border-b .px-4 .sm:px-8 py-3">
        {!isMobile && ( 
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
          <div className="flex items-center gap-2">
            <Package className="text-primary h-5 w-5" />
            <h1 className="text-lg font-bold text-gray-800">My Orders</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/my-returns')} size="sm">
              <PackageX className="h-4 w-4 mr-1" /> Returns
            </Button>
            <Button variant="outline" onClick={fetchOrders} size="sm">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-9 text-sm h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-1">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const active = activeStatus === key;
            const Icon = cfg.icon;
            return (
              <Button
                key={key}
                variant={active ? 'default' : 'outline'}
                size="sm"
                className={`flex-shrink-0 gap-1 px-3 py-1 text-xs ${active ? 'font-semibold' : ''}`}
                onClick={() => setActiveStatus(key)}
              >
                <Icon className={`h-3 w-3 ${cfg.color}`} />
                {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ===== Orders List ===== */}
      <div className=".p-4 .sm:p-8 .max-w-6xl mx-auto">
        {displayedOrders.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const cfg = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.all;
              const Icon = cfg.icon;
              return (
                <Card key={order.order_id} className="border shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base font-semibold">
                        #{order.order_id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <Badge className={`${cfg.bg} ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
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

                    <div className="border-t pt-3 flex justify-between text-sm font-medium">
                      <span>Total</span>
                      <span className="text-primary font-semibold">
                        Ksh {(order.amount || 0).toLocaleString()}
                      </span>
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
      </div>
    </div>
  );
});

export default OrdersPage;
