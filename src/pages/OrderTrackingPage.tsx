import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Search, Package, MapPin, Phone, Mail, Clock, CheckCircle2, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { MobileHeader } from '@/components/ui/mobile-header';

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
  tracking_number?: string;
}

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const isMobile = isMobileUserAgent();
  
  const [trackingInput, setTrackingInput] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const trackingSteps = [
    { status: 'pending', label: 'Order Placed', icon: Package },
    { status: 'paid', label: 'Payment Confirmed', icon: CheckCircle2 },
    { status: 'processing', label: 'Processing', icon: Package },
    { status: 'shipped', label: 'Shipped', icon: Package },
    { status: 'delivered', label: 'Delivered', icon: CheckCircle2 },
  ];

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

  const getCurrentStepIndex = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'cancelled') return -1;
    
    const index = trackingSteps.findIndex(step => step.status === statusLower);
    return index;
  };

  const handleTrackOrder = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!trackingInput.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter an order number or tracking number",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setOrder(null);

      // Clean the input (remove spaces, convert to lowercase)
      const cleanInput = trackingInput.trim().toLowerCase();

      // Try to find order by order_id or tracking_number
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`order_id.ilike.%${cleanInput}%,tracking_number.ilike.%${cleanInput}%`)
        .limit(1)
        .single();

      if (error || !data) {
        toast({
          title: "Order not found",
          description: "No order found with this tracking number. Please check and try again.",
          variant: "destructive"
        });
        return;
      }

      // Type cast the data
      const typedOrder = {
        ...data,
        items: data.items ? (data.items as unknown as OrderItem[]) : null
      } as Order;

      setOrder(typedOrder);
      
      toast({
        title: "Order found!",
        description: "Your order details are displayed below.",
      });

    } catch (err: any) {
      console.error('Error tracking order:', err);
      toast({
        title: "Error",
        description: "An error occurred while tracking your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className={`min-h-screen bg-gray-50/50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader
          title="Track Order"
          backTo="/"
        />
      )}

      <main className={`flex-grow container py-8 px-4 ${!isMobile ? 'xl:px-24' : ''}`}>
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enter your order number or tracking number to check the status of your delivery
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-2xl mx-auto mb-8 shadow-sm">
          <CardHeader>
            <CardTitle>Enter Tracking Information</CardTitle>
            <CardDescription>
              You can find your order number in your order confirmation email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrackOrder} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter order number (e.g., #ABC12345) or tracking number"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Track Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* No Results */}
        {searched && !order && !loading && (
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardContent className="py-16 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Order Not Found</h3>
              <p className="text-gray-500 mb-6">
                We couldn't find an order with that tracking number. Please check your order number and try again.
              </p>
              <Button variant="outline" onClick={() => setSearched(false)}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Order Status Timeline */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Order #{order.order_id.slice(-8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {format(new Date(order.created_at), 'PPP')}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border px-4 py-2 text-sm font-medium`}>
                    <span className="mr-2">{getStatusIcon(order.status)}</span>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                {order.status.toLowerCase() === 'cancelled' ? (
                  <div className="text-center py-8">
                    <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Cancelled</h3>
                    <p className="text-gray-500">This order has been cancelled.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-8">
                      {trackingSteps.map((step, index) => {
                        const currentStep = getCurrentStepIndex(order.status);
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        const Icon = step.icon;

                        return (
                          <div key={step.status} className="relative flex items-center gap-6">
                            <div
                              className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 ${
                                isCompleted
                                  ? 'bg-primary border-primary'
                                  : 'bg-white border-gray-300'
                              }`}
                            >
                              <Icon
                                className={`h-7 w-7 ${
                                  isCompleted ? 'text-white' : 'text-gray-400'
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h3
                                className={`text-lg font-semibold ${
                                  isCompleted ? 'text-gray-900' : 'text-gray-400'
                                }`}
                              >
                                {step.label}
                              </h3>
                              {isCurrent && (
                                <p className="text-sm text-primary font-medium mt-1">
                                  Current Status
                                </p>
                              )}
                            </div>
                            {isCompleted && (
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">
                    {order.shipping_address || 'No shipping address provided'}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card className="shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-gray-400" />
                  Order Items
                  <Badge variant="secondary" className="ml-auto">
                    {order.items?.length || 0} items
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-6">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex py-4 items-center first:pt-0 last:pb-0">
                          <div className="flex items-center flex-1">
                            {item.product.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}

                            <div className="ml-4 flex-1">
                              <h4 className="font-semibold text-gray-900">{item.product.name}</h4>
                              {renderVariantSelections(item.variant_selections)}
                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              <p className="text-sm font-semibold text-gray-900 mt-1">
                                Ksh {(item.product.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4 flex justify-between items-center bg-gray-50 rounded-lg p-4">
                      <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                      <span className="text-2xl font-bold text-gray-900">
                        Ksh {(order.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No items in this order</p>
                )}
              </CardContent>
            </Card>

            {/* Track Another Order Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setOrder(null);
                  setSearched(false);
                  setTrackingInput('');
                }}
                className="px-8"
              >
                Track Another Order
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderTrackingPage;