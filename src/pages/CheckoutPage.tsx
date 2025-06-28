
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useMpesaPayment } from '@/hooks/useMpesaPayment';
import Header from '@/components/Header';
//import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { PhoneInput } from '@/components/ui/phone-input';
import { Json } from '@/integrations/supabase/types';
import { Loader2, CheckCircle } from 'lucide-react';

const checkoutSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required' }),
  lastName: z.string().min(2, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  address: z.string().min(5, { message: 'Address is required' }),
  city: z.string().min(2, { message: 'City is required' }),
  paymentMethod: z.enum(['mpesa']),
  //notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface ShippingAddress {
  id: string;
  recipient_name: string;
  street_address: string;
  city: string;
  postal_code: string | null;
  country: string;
  phone_number: string;
  is_default: boolean | null;
}

const CheckoutPage = () => {
  const { user, profile } = useAuth();
  const { cartItems, clearCart, loading: cartLoading } = useCart();
  const items = cartItems;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const { initiatePayment, checkPaymentStatus, isProcessing } = useMpesaPayment();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<ShippingAddress | null>(null);
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const shippingFee = 0;
  const total = subtotal + shippingFee;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      paymentMethod: 'mpesa',
      //notes: '',
    },
  });

  // Show loading while cart is being fetched
  if (cartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <div>Loading cart...</div>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty - but only do this once to prevent loops
  useEffect(() => {
    if (!cartLoading && items.length === 0 && !hasRedirected) {
      setHasRedirected(true);
      navigate('/cart');
    }
  }, [items.length, navigate, cartLoading, hasRedirected]);

  // Don't render checkout if cart is empty
  if (!cartLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div>Redirecting to cart...</div>
        </div>
      </div>
    );
  }

  // Fetch user's shipping addresses
  const fetchAddresses = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAddresses(data);
        
        const defaultAddress = data.find(address => address.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        } else {
          setSelectedAddress(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Prefill form with user data if available
  useEffect(() => {
    if (profile && user) {
      form.setValue('firstName', profile.first_name || '');
      form.setValue('lastName', profile.last_name || '');
      form.setValue('email', user.email || '');
      form.setValue('phone', profile.phone || '');
    }
  }, [profile, user]);
  
  // Update form with selected address
  useEffect(() => {
    if (selectedAddress) {
      const nameParts = selectedAddress.recipient_name.split(' ');
      form.setValue('firstName', nameParts[0] || '');
      form.setValue('lastName', nameParts.slice(1).join(' ') || '');
      form.setValue('address', selectedAddress.street_address);
      form.setValue('city', selectedAddress.city);
      form.setValue('phone', selectedAddress.phone_number);
    }
  }, [selectedAddress]);

  // Poll payment status when processing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentStep === 'processing' && checkoutRequestId) {
      interval = setInterval(async () => {
        const status = await checkPaymentStatus(checkoutRequestId);
        
        if (status?.status === 'success') {
          setPaymentStep('success');
          clearCart();
          toast({
            title: "Payment Successful!",
            description: "Your order has been confirmed and will be processed shortly.",
          });
          
          setTimeout(() => {
            navigate('/orders');
          }, 3000);
        } else if (status?.status === 'failed') {
          setPaymentStep('form');
          setIsSubmitting(false);
          toast({
            title: "Payment Failed",
            description: status.result_desc || "Payment was not completed. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStep, checkoutRequestId, clearCart, navigate, toast, checkPaymentStatus]);
  
  const onSubmit = async (data: CheckoutFormValues) => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checking out.",
        variant: "destructive",
      });
      navigate('/products');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order in the database
      const orderId = `ORD-${Date.now()}`;
      
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          user_id: user?.id,
          email: data.email,
          phone_number: data.phone,
          status: 'pending',
          amount: total,
          items: items as unknown as Json,
          shipping_address: `${data.address}, ${data.city}`,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Initiate M-Pesa payment
      const paymentResult = await initiatePayment({
        phone: data.phone,
        amount: total,
        orderId: orderId
      });

      if (paymentResult.success && paymentResult.checkoutRequestId) {
        setCheckoutRequestId(paymentResult.checkoutRequestId);
        setPaymentStep('processing');
      } else {
        throw new Error(paymentResult.error || 'Payment initiation failed');
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (paymentStep === 'processing') {
    return (
      <div className="min-h-screen flex flex-col">

        <main className="flex-grow container py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
                  <h2 className="text-xl font-semibold">Processing Payment</h2>
                  <p className="text-muted-foreground text-center">
                    Please check your phone and enter your M-Pesa PIN to complete the payment.
                  </p>
                  <div className="bg-orange-50 p-4 rounded-lg w-full">
                    <p className="text-sm text-orange-800">
                      <strong>Amount:</strong> Ksh {total.toLocaleString()}<br/>
                      <strong>Order ID:</strong> {checkoutRequestId}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container py-8">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <h2 className="text-xl font-semibold text-green-600">Payment Successful!</h2>
                  <p className="text-muted-foreground text-center">
                    Your payment has been confirmed and your order is being processed.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to your orders...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="checkout-form">
                {addresses.length > 0 && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Your Shipping Addresses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RadioGroup 
                        onValueChange={(value) => {
                          const address = addresses.find(a => a.id === value);
                          if (address) setSelectedAddress(address);
                        }}
                        defaultValue={selectedAddress?.id}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        {addresses.map((address) => (
                          <div key={address.id} className={`border rounded-lg p-4 flex gap-3 ${
                            selectedAddress?.id === address.id ? 'ring-2 ring-orange-500' : ''
                          }`}>
                            <RadioGroupItem value={address.id} id={address.id} />
                            <div className="w-full">
                              <p className="font-medium">{address.recipient_name}</p>
                              <p className="text-sm text-muted-foreground">{address.street_address}</p>
                              <p className="text-sm text-muted-foreground">{address.city}, {address.postal_code}</p>
                              <p className="text-sm text-muted-foreground">{address.phone_number}</p>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                      <div className="mt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => navigate('/shipping')}
                        >
                          Add New Address
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              
                <div>
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (M-Pesa Number)</FormLabel>
                          <FormControl>
                            <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="+254712345678"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Street address, apartment, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex flex-col space-y-3"
                          >
                            <div className="flex items-center space-x-2 border p-4 rounded-md bg-green-50">
                              <RadioGroupItem value="mpesa" id="mpesa" />
                              <label htmlFor="mpesa" className="flex items-center gap-2 cursor-pointer">
                                <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-bold">M-PESA</div>
                                <span>Pay with M-Pesa</span>
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="md:hidden">
                  <Separator className="mb-4" />
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>Ksh {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Ksh {shippingFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>Ksh {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    type="submit"
                    disabled={isSubmitting || isProcessing}
                  >
                    {isSubmitting || isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay with M-Pesa'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div className="hidden md:block">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.product_id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p>Ksh {(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Ksh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>Ksh {shippingFee.toLocaleString()}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>Ksh {total.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  form="checkout-form"
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  type="submit"
                  disabled={isSubmitting || isProcessing}
                >
                  {isSubmitting || isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay with M-Pesa'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
