
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
//import Footer from '@/components/Footer';
//import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Download, Settings } from 'lucide-react';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { useToast } from '@/components/ui/use-toast';
import { MobileHeader } from '@/components/ui/mobile-header';
import useIsMobile from '@/hooks/use-mobile';

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
  shipping_address: string | null;
}

const OrdersPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile;

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
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
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleDownloadReceipt = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      downloadReceipt(order);
      toast({
        title: "Receipt downloaded",
        description: "The receipt has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Failed to download receipt",
        description: "There was an error generating the receipt.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-500';
      case 'processing':
        return 'bg-blue-500';
      case 'shipped':
        return 'bg-purple-500';
      case 'delivered':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4">Loading your orders...</p>
          </div>
        </main>

        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
        {!isMobile && <Header />}
        <MobileHeader
          title="My Orders"
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      <main className="flex-grow container py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-4">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, you'll be able to track it here.</p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate('/products')}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.order_id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/order/${order.order_id}`)}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.order_id}</CardTitle>
                    <CardDescription>
                      {order.created_at ? 
                        `Placed ${formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}` : 
                        'Date unavailable'}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Items</span>
                      <span className="font-medium">{order.items?.length || 0} products</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">Ksh {order.amount?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => handleDownloadReceipt(order, e)}
                      >
                        <FileText className="h-4 w-4" />
                        Text
                      </Button>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/order/${order.order_id}`);
                        }}
                        className="bg-orange-500 hover:bg-orange-600"
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
