import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useMpesaPayment } from '@/hooks/useMpesaPayment';
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useDeliveryAddresses } from '@/hooks/useDeliveryAddresses';
import { useLocations } from '@/hooks/useLocations';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Loader2, 
  X,
  Download,
  ShoppingBag
} from 'lucide-react';
import CheckoutSkeleton from '@/components/checkout/CheckoutSkeleton';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { user, profile } = useAuth();
  const { calculations, getSelectedItems } = useSelectiveCart();
  const { clearCart } = useCartContext();
  const { initiatePayment, checkPaymentStatus, isProcessing } = useMpesaPayment();

  const { addresses, loading: addressesLoading, getDefaultAddress, addAddress } = useDeliveryAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    message: string;
    checkoutRequestId: string | null;
  }>({
    status: 'idle',
    message: '',
    checkoutRequestId: null
  });
  const paymentStatusRef = useRef(paymentStatus);
  const [orderId, setOrderId] = useState('');

  // Form data states
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    user_id: '',
    email: '',
    phone: ''
  });

  const { getCountyOptions, getCityOptions, isLoading: locationsLoading } = useLocations();

  const [deliveryData, setDeliveryData] = useState({
    address: '',
    city: '',
    county: '',
    deliveryMethod: 'standard'
  });

  type ErrorsType = {
    userName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    county?: string;
  };

  const [errors, setErrors] = useState<ErrorsType>({});

  const freeDeliveryThreshold = 10000;
  const isEligibleForFreeDelivery = calculations.subtotal >= freeDeliveryThreshold;

  // Initialize form data
  useEffect(() => {
    setCustomerData({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      userName: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '',
      email: user?.email || '',
      user_id: profile?.user_id || '',
      phone: profile?.phone || ''
    });

    // Load default address if available
    const defaultAddress = getDefaultAddress();
    if (defaultAddress && !selectedAddressId) {
      setDeliveryData({
        address: defaultAddress.street_address,
        city: defaultAddress.city,
        county: defaultAddress.county,
        deliveryMethod: 'standard'
      });
      setSelectedAddressId(defaultAddress.id);
    } else if (profile && !defaultAddress) {
      // Fallback to profile data if no saved addresses
      setDeliveryData({
        address: profile?.address || '',
        city: profile?.city || '',
        county: profile?.county || '',
        deliveryMethod: 'standard'
      });
    }
  }, [profile, user, addresses]);

  const handleAddressSelect = (addressId: string) => {
  const address = addresses.find(addr => addr.id === addressId);
  if (address) {
    setSelectedAddressId(addressId);
    setDeliveryData({
      address: address.street_address,
      city: address.city,
      county: address.county,
      deliveryMethod: 'standard'
    });
    setCustomerData(prev => ({
      ...prev,
      userName: address.full_name,
      phone: address.phone
    }));
  }
};

const handleSaveNewAddress = async () => {
  try {
    await addAddress({
      address_name: 'Custom Address',
      full_name: `${customerData.firstName} ${customerData.lastName}`.trim(),
      phone: customerData.phone,
      street_address: deliveryData.address,
      city: deliveryData.city,
      county: deliveryData.county,
      is_default: addresses.length === 0 // Set as default if it's the first address
    });
    setShowAddressForm(false);
  } catch (error) {
    console.error('Error saving address:', error);
  }
};

  // Check if user has items to checkout
  useEffect(() => {
    if (calculations.selectedItemsCount === 0) {
      navigate('/cart');
    }
  }, [calculations.selectedItemsCount, navigate]);



  const steps = [
    { id: 1, title: 'Customer Details', description: 'Personal information' },
    { id: 2, title: 'Review', description: 'Order summary' }
  ];

  // Validation functions
  const validateStep1 = () => {
    const newErrors: ErrorsType = {};
    
   if (!customerData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!customerData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    
    if (!customerData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+254|254|0)[17]\d{8}$/.test(customerData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: ErrorsType = {};
    
    if (!deliveryData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!deliveryData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!deliveryData.county.trim()) {
      newErrors.county = 'County is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      // Save customer data to profile before moving to step 2
      updateProfileDeliveryInfo({
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        phone: customerData.phone
      });
      setCurrentStep(2);
    } else if (currentStep === 1 && validateStep2()) {
      // Save all delivery data to profile before moving to step 3
      updateProfileDeliveryInfo({
        address: deliveryData.address,
        city: deliveryData.city,
        county: deliveryData.county
      });
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setShowPaymentModal(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/cart');
    }
  };

  // Input change handlers
  const handleCustomerChange = (field, value) => {
    const trimmedValue = value.trim();
    setCustomerData((prev) => ({
      ...prev,
      [field]: trimmedValue,
    }));
  };

  const handleDeliveryChange = (field, value) => {
    setDeliveryData(prev => ({ 
      ...prev, 
      [field]: value,
      ...(field === 'county' ? { city: '' } : {})
    }));
  
  if (errors[field]) {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  // Update profile with new delivery information - fix the typing here
  const updates: { [key: string]: string } = { [field]: value };
  
  // If county changes, also clear city in profile
  if (field === 'county') {
    updates.city = '';
  }
  
  updateProfileDeliveryInfo(updates);
};

  // Get available cities based on selected county
  const getAvailableCities = () => {
    if (!deliveryData.county) return [];
    return getCityOptions(deliveryData.county);
  };

  // Payment handling
  const handleMpesaPayment = async () => {
    const newOrderId = `ORD-${Date.now()}`;
    setOrderId(newOrderId);
    setPaymentStatus({ status: 'processing', message: '', checkoutRequestId: null });

    try {
      const selectedItemsWithDetails = getSelectedItems();
      const orderItems = selectedItemsWithDetails.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image
        },
        variant_selections: item.variant_selections || {},
        quantity: item.quantity
      }));

      const deliveryCost = deliveryData.deliveryMethod === 'express' ? 1200 : 0;
      const finalTotal = calculations.total + deliveryCost;

      const countyName = getCountyOptions().find(c => c.value === deliveryData.county)?.label || deliveryData.county;
      const cityName = getCityOptions(deliveryData.county).find(c => c.value === deliveryData.city)?.label || deliveryData.city;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: newOrderId,
          user_id: customerData.user_id || null,
          email: customerData.email,
          phone_number: customerData.phone,
          status: 'pending',
          amount: finalTotal,
          items: orderItems,
          shipping_address: `${countyName}, ${cityName}, ${deliveryData.address}`,
          username: `${customerData.firstName} ${customerData.lastName}`.trim(),
          discount_amount: calculations.discount,
          delivery_fee: calculations.shipping,
          tracking_number: newOrderId.slice(-5).toUpperCase(),
        })
        .select('order_id')
        .single();

      if (orderError) {
        throw new Error('Failed to create order. Please try again.');
      }

      // Initiate M-Pesa payment
      const result = await initiatePayment({
        phone: customerData.phone,
        amount: finalTotal,
        orderId: newOrderId
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      const newStatus = {
        status: 'waiting',
        checkoutRequestId: result.checkoutRequestId ?? null,
        message: 'Check your phone and enter your M-Pesa PIN'
      };
      setPaymentStatus(newStatus);
      paymentStatusRef.current = newStatus;

      // Start polling for payment status
      const pollPayment = setInterval(async () => {
        try {
          if (result.checkoutRequestId) {
            const status = await checkPaymentStatus(result.checkoutRequestId);

            if (status?.status === 'success') {
              const successStatus = { status: 'success', message: '', checkoutRequestId: null };
              setPaymentStatus(successStatus);
              paymentStatusRef.current = successStatus;

              paymentStatusRef.current = successStatus;
              clearCart();
              clearInterval(pollPayment);
              setTimeout(() => {
                setShowPaymentModal(false);
                navigate(`/order/${newOrderId}`);
              }, 2000);
            } else if (status?.status === 'failed') {
              const failedStatus = {
                status: 'failed',
                message: status.result_desc || 'Payment failed',
                checkoutRequestId: null
              };
              setPaymentStatus(failedStatus);
              paymentStatusRef.current = failedStatus;
              clearInterval(pollPayment);
            }
          }
        } catch (error) {
          //console.error('Error checking payment status:', error);
        }
      }, 1000);

      // Set timeout for payment
      setTimeout(() => {
        clearInterval(pollPayment);

        // Always check the current status, not the stale state
        if (paymentStatusRef.current.status === 'waiting') {
          const timeoutStatus = { 
            status: 'timeout', 
            message: 'Payment request timed out', 
            checkoutRequestId: null 
          };
          setPaymentStatus(timeoutStatus);
          paymentStatusRef.current = timeoutStatus;
        }
      }, 15000);

    } catch (error) {
      //console.error('Payment error:', error);
      setPaymentStatus({
        status: 'failed',
        message: typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message || 'Payment failed. Please try again.' : 'Payment failed. Please try again.',
        checkoutRequestId: null
      });
    }
  };

  const handleRetryPayment = () => {
    setPaymentStatus({ status: 'idle', message: '', checkoutRequestId: null });
  };

  // Add this function after your existing handler functions
  const updateProfileDeliveryInfo = async (updates) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        //console.error('Error updating profile delivery info:', error);
      }
    } catch (error) {
      //console.error('Error updating profile delivery info:', error);
    }
  };

  // Calculate totals
  const deliveryCost = deliveryData.deliveryMethod === 'express' ? 1200 : 0;
  const finalTotal = calculations.total + deliveryCost;
  const selectedItems = getSelectedItems();

  // Step content renderers
const renderStep1 = () => (
  <div className='min-h-screen mb-10'>
  {addresses.length > 0 && (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Saved Addresses
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddressForm(!showAddressForm)}
          >
            {showAddressForm ? 'Cancel' : 'Add New'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedAddressId === address.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleAddressSelect(address.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{address.full_name}</p>
                  {address.is_default && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{address.phone}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {address.street_address}, {address.city}, {address.county}
                </p>
              </div>
              {selectedAddressId === address.id && (
                <CheckCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
    )}

    {(showAddressForm || addresses.length === 0) && (
    <div className="space-y-6.">
      {!isMobile && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Delivery Information</h3>
          <p className="text-gray-600">
            Please provide your contact details and delivery address for order updates and delivery.
          </p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={customerData.firstName}
                onChange={(e) => handleCustomerChange('firstName', e.target.value)}
                placeholder="Enter your first name"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={customerData.lastName}
                onChange={(e) => handleCustomerChange('lastName', e.target.value)}
                placeholder="Enter your last name"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>


          <div>
            <Label htmlFor="phone">Phone Number (M-Pesa)</Label>
            <Input
              id="phone"
              value={customerData.phone}
              onChange={(e) => handleCustomerChange('phone', e.target.value)}
              placeholder="0712345678"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Delivery Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="county">County</Label>
              <Select value={deliveryData.county} onValueChange={(value) => handleDeliveryChange('county', value)}>
                <SelectTrigger className={errors.county ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  {getCountyOptions().map((county) => (
                    <SelectItem key={county.value} value={county.value}>
                      {county.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.county && (
                <p className="text-red-500 text-sm mt-1">{errors.county}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="city">City/Town</Label>
              <Select 
                value={deliveryData.city} 
                onValueChange={(value) => handleDeliveryChange('city', value)}
                disabled={!deliveryData.county}
              >
                <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                  <SelectValue placeholder={deliveryData.county ? "Select city" : "Select county first"} />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableCities().map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              value={deliveryData.address}
              onChange={(e) => handleDeliveryChange('address', e.target.value)}
              placeholder="Enter your full street address"
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    )}
  </div>
);

  const renderStep2 = () => (
    <div className='min-h-screen mb-10'>
      <div className="space-y-6.">
        <div>
          <h3 className="text-xl font-semibold mb-2">Review Your Order</h3>
          {!isMobile && ( 
            <p className="text-gray-600">
            Please review your order details before proceeding to payment.
          </p>)}
        </div>

        {/* Customer Details Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className='truncate'><span className="font-medium">Name:</span> {customerData.firstName} {customerData.lastName}</p>
            <p className='truncate'><span className="font-medium">Email:</span> {customerData.email}</p>
            <p className='truncate'><span className="font-medium">Phone:</span> {customerData.phone}</p>
          </CardContent>
        </Card>

        {/* Delivery Details Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className='truncate'><span className="font-medium">County:</span> {getCountyOptions().find(c => c.value === deliveryData.county)?.label}</p>
            <p className='truncate'><span className="font-medium">City:</span> {getCityOptions(deliveryData.county).find(c => c.value === deliveryData.city)?.label}</p>
            <p className='truncate'><span className="font-medium">Address:</span> {deliveryData.address}</p>
            {/*<p><span className="font-medium">Delivery Method:</span> Standard Delivery (1-3 hours)</p>*/}
          </CardContent>
        </Card>
      </div>
    
      {/* Order Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          {/* Items */}
          <ScrollArea className="max-h-60">
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">
                      {item.product.name}
                    </p>
                    
                    {/* Variant display */}
                    {item.variant_selections && Object.keys(item.variant_selections).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.variant_selections as Record<string, string>).map(([type, value]) => (
                          <span key={`${type}-${value}`} className="text-xs text-gray-500">
                            <span className="capitalize font-medium">{type}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-medium">
                        KES {(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

            <Separator />

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">KES {calculations.subtotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Delivery</span>
                <span className={`font-medium ${isEligibleForFreeDelivery ? 'text-green-600' : ''}`}>
                  {calculations.shipping > 0 ? `KES ${calculations.shipping.toLocaleString()}` : 
                  isEligibleForFreeDelivery ? 'FREE' : 'KES 0'}
                </span>
              </div>

              {calculations.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">KES {calculations.tax.toLocaleString()}</span>
                </div>
              )}

              {calculations.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-KES {calculations.discount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span className="text-orange-600">KES {finalTotal.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Payment Modal Content
  const renderPaymentModal = () => {
    const renderPaymentContent = () => {
      switch (paymentStatus.status) {
        case 'processing':
          return (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Initiating Payment...</h3>
              <p className="text-gray-600">Please wait while we process your payment request.</p>
            </div>
          );

        case 'waiting':
          return (
            <div className="text-center py-8">
              <div className="relative mb-6">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">📱</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Waiting for Payment</h3>
              <p className="text-gray-600 mb-4">
                Check your phone and enter your M-Pesa PIN to complete the payment
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Amount: KES {finalTotal.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Phone: {customerData.phone}</p>
              </div>
            </div>
          );

        case 'success':
          return (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-green-600 mr-2" />
                <span className="text-sm text-green-600">Redirecting to order details...</span>
              </div>
            </div>
          );

        case 'failed':
        case 'timeout':
          return (
            <div className="text-center py-8">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                {paymentStatus.status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
              </h3>
              <p className="text-gray-600 mb-4">
                {paymentStatus.status === 'timeout' 
                  ? 'Payment request timed out. Please try again.'
                  : paymentStatus.message || 'Payment could not be processed.'
                }
              </p>
              <Button onClick={handleRetryPayment} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </div>
          );

        default:
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
                <p className="text-gray-600">You'll receive an STK Push notification on {customerData.phone}</p>
              </div>

              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M-PESA</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Pay with M-Pesa</h4>
                        <p className="text-sm text-green-700">Secure STK Push payment</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-900">KES {finalTotal.toLocaleString()}</p>
                      <p className="text-sm text-green-700">{customerData.phone}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleMpesaPayment}
                    disabled={isProcessing}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay with M-Pesa'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
      }
    };

    return (
      <Dialog open={showPaymentModal} onOpenChange={() => {
        if (paymentStatus.status !== 'processing' && paymentStatus.status !== 'waiting') {
          setShowPaymentModal(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment</DialogTitle>
          </DialogHeader>
          {renderPaymentContent()}
        </DialogContent>
      </Dialog>
    );
  };

  const progressValue = (currentStep / 2) * 100;

return (
  <div>
    {locationsLoading || addressesLoading ? (
      <CheckoutSkeleton />
    ) : (
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
        <div
          className={`container mx-auto .py-6 ${
            !isMobile ? 'xl:px-24' : '.pb-32 px-0'
          }`}
        >
          {!isMobile && (<div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-600 mt-1">
              Complete your order in {2 - currentStep + 0} more step{2 - currentStep + 1 !== 1 ? 's' : ''}
            </p>
          </div>)}

        <div className="grid grid-cols-1 lg:grid-cols-3 .gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Progress Section */}
              {!isMobile && (
              <div className="p-6 border-b">
                <div className="mb-4">
                  <Progress value={progressValue} className="w-full" />
                </div>
                
                <div className="flex justify-between">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 ${
                        currentStep >= step.id
                          ? 'text-orange-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                          currentStep >= step.id
                            ? 'border-orange-600 bg-orange-100 text-orange-600'
                            : 'border-gray-300 text-gray-400'
                        }`}
                      >
                        {currentStep > step.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Step Content */}
              <div className="p-6">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
              </div>

              {/* Navigation */}
              <div
                className={`border-t bg-gray-50 ${
                  isMobile
                    ? 'fixed bottom-0 left-0 right-0 z-50 shadow-lg p-2'
                    : 'p-6'
                }`}
              >
                <div className="flex justify-between max-w-md mx-auto">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 mr-2"
                  >
                    {currentStep === 1 ? 'Back to Cart' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {currentStep === 2 ? 'Proceed to Payment' : 'Continue'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {renderPaymentModal()}
    </div>
    )}
    </div>
  );
};

export default CheckoutPage;
