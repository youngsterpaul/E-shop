import { useCheckout } from '@/contexts/CheckoutContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useMpesaPayment } from '@/hooks/useMpesaPayment';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';

export const PaymentStep = () => {
  const { 
    customerDetails, 
    deliveryInfo, 
    paymentStatus, 
    updatePaymentStatus, 
    setStep 
  } = useCheckout();
  
  // Use getSelectedItems() instead of selectedItems to get full item objects
  const { calculations, getSelectedItems } = useSelectiveCart();
  const { clearCart } = useCartContext();
  const { initiatePayment, checkPaymentStatus, isProcessing } = useMpesaPayment();
  const [timeoutTimer, setTimeoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Calculate total with delivery
  const deliveryCost = deliveryInfo.deliveryMethod === 'express' ? 1200 : 0;
  const finalTotal = calculations.total + deliveryCost;

  // Cleanup function
  const cleanup = () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      setTimeoutTimer(null);
    }
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  // Set timeout for payment (30 seconds for production)
  useEffect(() => {
    if (paymentStatus.status === 'waiting') {
      const timer = setTimeout(() => {
        updatePaymentStatus({ status: 'timeout' });
        cleanup();
      }, 30000); // 30 seconds
      
      setTimeoutTimer(timer);
    } else {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        setTimeoutTimer(null);
      }
    }
    
    return () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };
  }, [paymentStatus.status, updatePaymentStatus]);

  // Poll payment status
  useEffect(() => {
    if (paymentStatus.status === 'waiting' && paymentStatus.checkoutRequestId) {
      const interval = setInterval(async () => {
        try {
          const status = await checkPaymentStatus(paymentStatus.checkoutRequestId!);
          
          if (status?.status === 'success') {
            updatePaymentStatus({ status: 'success' });
            clearCart();
            cleanup();
            setStep(4);
          } else if (status?.status === 'failed') {
            updatePaymentStatus({ 
              status: 'failed',
              message: status.result_desc || 'Payment failed'
            });
            cleanup();
          } else if (status?.result_desc?.includes('cancelled') || status?.result_desc?.includes('timeout')) {
            updatePaymentStatus({ 
              status: 'failed',
              message: 'Payment was cancelled or timed out'
            });
            cleanup();
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
          // Don't update status on polling errors, just log them
        }
      }, 1000); // Check every 1 second for faster response
      
      setPollInterval(interval);
    } else {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
    }
    
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [paymentStatus.status, paymentStatus.checkoutRequestId, checkPaymentStatus, updatePaymentStatus, clearCart, setStep]);

  // Cleanup on component unmount
  useEffect(() => {
    return cleanup;
  }, []);

  const handleMpesaPayment = async () => {
    const orderId = `ORD-${Date.now()}`;
    updatePaymentStatus({ status: 'processing' });

    try {
      // Use Promise.race to enforce 30-second timeout on the entire process
      const paymentProcess = async () => {
        // Get the full selected items with all details
        const selectedItemsWithDetails = getSelectedItems();
        
        // Transform items to match your expected structure
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

        // First create the order in the database (optimized query)
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_id: orderId,
            user_id: customerDetails.user_id || null,
            email: customerDetails.email,
            phone_number: customerDetails.phone,
            status: 'pending',
            amount: finalTotal,
            items: orderItems, // Use the properly formatted items
            shipping_address: `${deliveryInfo.county}, ${deliveryInfo.city}, ${deliveryInfo.address}`,
            username: `${customerDetails.firstName} ${customerDetails.lastName}`,
            discount_amount: calculations.discount,
            tracking_number: orderId.slice(-8).toLocaleUpperCase(),
          })
          .select('order_id')
          .single();

        if (orderError) {
          throw new Error('Failed to create order. Please try again.');
        }

        // Then initiate M-Pesa payment with timeout
        const result = await initiatePayment({
          phone: customerDetails.phone,
          amount: finalTotal,
          orderId
        });

        if (!result.success) {
          throw new Error(result.error || 'Payment initiation failed');
        }

        return result;
      };

      // Race between payment process and timeout
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Payment process timed out')), 30000)
      );

      const result = await Promise.race([paymentProcess(), timeout]) as any;

      updatePaymentStatus({
        status: 'waiting',
        checkoutRequestId: result.checkoutRequestId,
        message: 'Check your phone and enter your M-Pesa PIN'
      });

    } catch (error: any) {
      console.error('Payment error:', error);
      updatePaymentStatus({
        status: 'failed',
        message: error.message || 'Payment failed. Please try again.'
      });
    }
  };

  const handleRetry = () => {
    cleanup();
    updatePaymentStatus({ status: 'idle' });
  };

  const handleBack = () => {
    if (paymentStatus.status === 'processing' || paymentStatus.status === 'waiting') {
      if (window.confirm('Payment is in progress. Are you sure you want to go back?')) {
        cleanup();
        updatePaymentStatus({ status: 'idle' });
        setStep(2);
      }
    } else {
      setStep(2);
    }
  };

  const renderPaymentContent = () => {
    switch (paymentStatus.status) {
      case 'processing':
        return (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-orange-900 mb-2">
                Initiating Payment...
              </h3>
              <p className="text-orange-700">
                Please wait while we process your payment request.
              </p>
            </CardContent>
          </Card>
        );

      case 'waiting':
        return (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6 text-center">
              <div className="relative">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                {/* Loading spinner similar to Kilimall */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Waiting for Payment
              </h3>
              <p className="text-blue-700 mb-4">
                Check your phone and enter your M-Pesa PIN to complete the payment
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Amount: KES {finalTotal.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Phone: {customerDetails.phone}</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'failed':
      case 'timeout':
        return (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {paymentStatus.status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
              </h3>
              <p className="text-red-700 mb-4">
                {paymentStatus.status === 'timeout' 
                  ? 'Payment request timed out. Please try again.'
                  : paymentStatus.message || 'Payment could not be processed.'
                }
              </p>
              <Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-green-700 mb-4">
                Your payment has been processed successfully.
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-green-600 mr-2" />
                <span className="text-sm text-green-600">Redirecting...</span>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50 cursor-pointer hover:bg-green-100 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M-PESA</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Pay with M-Pesa</h3>
                      <p className="text-sm text-green-700">Secure STK Push payment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-900">KES {finalTotal.toLocaleString()}</p>
                    <p className="text-sm text-green-700">{customerDetails.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            <div className="text-center">
              <p className="text-sm text-gray-500">
                You'll receive an STK Push notification on {customerDetails.phone}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Payment</h3>
        
        {/* Payment Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h4 className="font-medium mb-3">Payment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items ({calculations.selectedItemsCount})</span>
                <span>KES {calculations.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery ({deliveryInfo.deliveryMethod})</span>
                <span>KES {deliveryCost.toLocaleString()}</span>
              </div>
              {/*{calculations.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax (16%)</span>
                  <span>KES {calculations.tax.toLocaleString()}</span>
                </div>
              )} */}
              {calculations.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-KES {calculations.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>KES {finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {renderPaymentContent()}
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={paymentStatus.status === 'processing' || paymentStatus.status === 'waiting'}
        >
          Back
        </Button>
      </div>
    </div>
  );
};