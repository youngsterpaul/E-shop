import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Download, Settings, Package, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import { isMobileUserAgent } from '@/hooks/use-mobile';

interface OrderItem {
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image?: string;
}

interface Order {
  order_id: string;
  user_id: string | null;
  email: string | null;
  phone_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  amount: number;
  first_name?: string;
  last_name?: string;
  shipping_address: string | null;
}

// Loading skeleton component for orders
const OrderSkeleton = () => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="flex-1">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-6 w-20" />
    </CardHeader>
    <CardContent>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex flex-col">
          <Skeleton className="h-4 w-12 mb-1" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Loading skeleton for the entire page
const PageLoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-gray-50/50">
    <main className="flex-grow container py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <OrderSkeleton key={i} />
        ))}
      </div>
    </main>
  </div>
);

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = isMobileUserAgent();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/signin');
    }
  }, [user, authLoading, navigate]);

  // Fetch user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        // Type cast the data to ensure items is properly converted from Json to OrderItem[]
        const typedOrders = data.map(order => ({
          ...order,
          items: order.items ? (order.items as unknown as OrderItem[]) : []
        })) as Order[];
        
        setOrders(typedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error loading orders",
          description: "There was an error loading your orders. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchOrders();
    }
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '⏳';
      case 'paid':
        return '📦';
      case 'processing':
        return '⚙️';
      case 'shipped':
        return '🚚';
      case 'delivered':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  // Show loading skeleton while auth is loading or orders are loading
if (authLoading || loading) {
  return (
    <>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title="My Orders"
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      <PageLoadingSkeleton />
    </>
  );
}


  return (
    <div className={`min-h-screen bg-gray-50/50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title="My Orders"
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      
      <main className="flex-grow container py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No orders yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              When you place an order, you'll be able to track it here. Start shopping to see your order history.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card 
                key={order.order_id} 
                className="shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:bg-white" 
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
                        Order #{order.order_id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <CardDescription className="text-gray-500">
                        {order.created_at ? 
                          `Placed ${formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}` : 
                          'Date unavailable'}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} border px-3 py-1 font-medium`}>
                      <span className="mr-1">{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Items</span>
                        <span className="font-semibold text-gray-900">
                          {order.items?.length || 0} {order.items?.length === 1 ? 'product' : 'products'}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Total</span>
                        <span className="font-semibold text-gray-900 text-lg">
                          Ksh {order.amount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      {order.shipping_address && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Shipping to</span>
                          <span className="font-medium text-gray-700 text-sm max-w-48 truncate">
                            {order.shipping_address}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/${order.order_id}`);
                        }}
                        className="bg-primary hover:bg-primary/90 px-4"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OrdersPage;