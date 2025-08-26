
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import ReviewButton from '@/components/ReviewButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, ArrowLeft, Clock, Settings, Package, MapPin, Phone, Mail, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { downloadReceipt } from '@/utils/receiptGenerator';
import { useToast } from '@/components/ui/use-toast';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';

// Updated interface to match the structure you're saving
interface OrderItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  variant_selections?: Record<string, any>;
  quantity: number;
}

// Legacy interface for receipt generation (if needed)
interface LegacyOrderItem {
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
  first_name?: string;
  last_name?: string;
  userName?: string;
  mpesa_checkout_request_id?: string;
  payment_id?: string;
}

// Loading skeleton for order items
const OrderItemSkeleton = () => (
  <div className="flex py-4 items-center justify-between first:pt-0">
    <div className="flex items-center flex-1">
      <Skeleton className="w-16 h-16 rounded-md" />
      <div className="ml-4 flex-1">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-4 w-32 mb-1" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
    <Skeleton className="h-8 w-20 ml-4" />
  </div>
);

// Loading skeleton for the entire page
const OrderDetailLoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-gray-50/50">
    <main className="flex-grow container py-8 px-4">
      <div className="space-y-6">
        {/* Order Summary Skeleton */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="flex-1">
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div>
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Order Items Skeleton */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="divide-y">
                {[...Array(2)].map((_, i) => (
                  <OrderItemSkeleton key={i} />
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
);

const OrderDetailPage = () => {
  const isMobile = isMobileUserAgent();
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
  
  const handleDownloadReceipt = () => {
    if (order) {
      try {
        // Transform the order to match the expected structure for downloadReceipt
        const transformedOrder = {
          ...order,
          items: order.items?.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image
          })) || null
        };
        downloadReceipt(transformedOrder);
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

  // Function to display variant selections
  const renderVariantSelections = (variant_selections?: Record<string, any>) => {
    if (!variant_selections || Object.keys(variant_selections).length === 0) {
      return null;
    }

    return (
      <div className="text-sm text-gray-500 mb-2">
        {Object.entries(variant_selections).map(([key, value], index) => (
          <span key={key}>
            {key}: {value}
            {index < Object.entries(variant_selections).length - 1 && ', '}
          </span>
        ))}
      </div>
    );
  };

  // Show loading skeleton
  if (loading) {
    return (
      <>
        {!isMobile && <Header />}
        {isMobile && (
          <MobileHeader
            title="Order Details"
            backTo="/orders"
            rightAction={
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
        )}
        <OrderDetailLoadingSkeleton />
      </>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50/50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title="Order Details"
          backTo="/orders"
          rightAction={
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          }
        />
      )}
      
      <main className="flex-grow container py-8 px-4">
        {/* Back Button for Desktop */}
        {!isMobile && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/orders')}
            className="mb-6 -ml-4 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        )}
        
        {error ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-red-50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <Button 
                onClick={() => navigate('/orders')}
                className="bg-primary hover:bg-primary/90"
              >
                Return to Orders
              </Button>
            </CardContent>
          </Card>
        ) : order ? (
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        Order #{order.order_id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <p className="text-gray-500 flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-2" />
                        Placed on {format(new Date(order.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} border px-4 py-2 font-medium`}>
                      <span className="mr-2">{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 hover:bg-gray-50 border-gray-200" 
                      onClick={handleDownloadReceipt}
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Receipt</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">Shipping Address</h3>
                    </div>
                    <div className="pl-8">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {order.shipping_address || 'No shipping address provided'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <h3 className="font-semibold text-gray-900">Contact Information</h3>
                    </div>
                    <div className="pl-8 space-y-2">
                      {order.userName && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">👤</span>
                          <p className="text-gray-700">{order.userName}</p>
                        </div>
                      )}
                      {order.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-700">{order.email}</p>
                        </div>
                      )}
                      {order.phone_number && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-gray-700">{order.phone_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Order Items */}
            <Card className="shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  <CardTitle className="text-xl font-semibold text-gray-900">Order Items</CardTitle>
                  <Badge variant="secondary" className="ml-auto">
                    {order.items?.length || 0} items
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-6">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex py-6 items-center justify-between first:pt-0 last:pb-0">
                          <div className="flex items-center flex-1">
                            {item.product.image ? (
                              <img 
                                src={item.product.image} 
                                alt={item.product.name}
                                className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            
                            <div className="ml-6 flex-1">
                              <h4 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2 min-h-[32px]">{item.product.name}</h4>
                              {renderVariantSelections(item.variant_selections)}
                              <p className="text-gray-500 mb-3">Quantity: {item.quantity}</p>
                              <div className="space-y-1">
                                <p className="font-semibold text-gray-900">
                                  Ksh {(item.product.price || 0).toLocaleString()} each
                                </p>
                                <p className="text-lg font-bold text-primary">
                                  Total: Ksh {((item.product.price || 0) * (item.quantity || 0)).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Review Button - Only show for delivered orders */}
                          {order.status === 'delivered' && (
                            <div className="ml-6">
                              <ReviewButton 
                                productId={item.product.id}
                                productName={item.product.name}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Total Section */}
                    <div className="border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                        <div>
                          <p className="text-gray-500 mb-1">Total Amount</p>
                          <p className="text-sm text-gray-500">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">
                          Ksh {(order.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Items Found</h3>
                    <p className="text-gray-500">No items found in this order</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-500 mb-6">The order you're looking for doesn't exist</p>
              <Button 
                onClick={() => navigate('/orders')} 
                className="bg-primary hover:bg-primary/90"
              >
                Return to Orders
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OrderDetailPage;
