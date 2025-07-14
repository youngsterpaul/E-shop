import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
//import Footer from '@/components/Footer';
//import MobileNav from '@/components/MobileNav';
import ReviewButton from '@/components/ReviewButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowLeft, Clock, Download, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { useToast } from '@/components/ui/use-toast';
import useIsMobile from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';

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
  amount: number | null;
  items: OrderItem[] | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
}

const OrderDetailPage = () => {
  const isMobile = useIsMobile;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
      return;
    }
    
    const fetchOrder = async () => {
      try {
        if (!id) return;
        
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('order_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        
        if (!data) {
          throw new Error('Order not found');
        }
        
        // Type cast the data to ensure items is properly converted from Json to OrderItem[]
        const typedOrder = {
          ...data,
          items: data.items ? (data.items as unknown as OrderItem[]) : null
        } as Order;
        
        setOrder(typedOrder);
      } catch (err: any) {
        console.error('Error fetching order:', err);
        setError(err.message);
        toast({
          title: "Failed to load order",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [id, user, navigate, toast]);
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'processing':
        return 'bg-primary text-primary-foreground';
      case 'shipped':
        return 'bg-secondary text-secondary-foreground';
      case 'delivered':
        return 'bg-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const handleDownloadReceipt = () => {
    if (order) {
      try {
        downloadReceipt(order);
        toast({
          title: "Receipt downloaded",
          description: "The receipt has been downloaded successfully.",
        });
      } catch (err) {
        toast({
          title: "Failed to download receipt",
          description: "There was an error generating the receipt.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow container py-8">
      {!isMobile && <Header />}
        <MobileHeader
          title="Order Details"
          backTo="/"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-red-500 mb-4">{error}</p>
              <Button onClick={() => navigate('/orders')}>Return to Orders</Button>
            </CardContent>
          </Card>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <div>
                  <CardTitle className="text-xl">Order #{order.order_id}</CardTitle>
                  <p className="text-sm text-muted-foreground flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-1" />
                    Placed on {format(new Date(order.created_at), 'PPP')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1" 
                      onClick={handleDownloadReceipt}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Text Receipt</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Shipping Address</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {order.shipping_address || 'No shipping address provided'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Contact Information</h3>
                    {order.email && <p className="text-muted-foreground">{order.email}</p>}
                    {order.phone_number && <p className="text-muted-foreground">{order.phone_number}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Order Items */}
            <Card className="shadow-sm">
              <CardHeader className="border-b pb-4">
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-6">
                    <div className="divide-y">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex py-4 items-center justify-between first:pt-0">
                          <div className="flex items-center">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                                No image
                              </div>
                            )}
                            <div className="ml-4 flex-1">
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                              <div className="mt-2">
                                <p className="font-medium">Ksh {(item.price || 0).toLocaleString()}</p>
                                <p className="text-sm text-muted-foreground">
                                  Total: Ksh {((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Review Button - Only show for delivered orders */}
                          {order.status === 'delivered' && (
                            <div className="ml-4">
                              <ReviewButton 
                                productId={item.product_id}
                                productName={item.name}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-4 flex justify-between items-center">
                      <p className="font-medium">Total Amount</p>
                      <p className="text-xl font-bold">Ksh {(order.amount || 0).toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-6 text-muted-foreground">No items found in this order</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg text-muted-foreground">Order not found</p>
              <Button onClick={() => navigate('/orders')} className="mt-4">Return to Orders</Button>
            </CardContent>
          </Card>
        )}
      </main>

      
    </div>
  );
};

export default OrderDetailPage;