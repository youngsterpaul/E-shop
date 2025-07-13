
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
  
  const { calculations, selectedItems } = useSelectiveCart();
  const { clearCart } = useCartContext();
  const { initiatePayment, checkPaymentStatus, isProcessing } = useMpesaPayment();
  const [countdown, setCountdown] = useState(30); // 5 minutes

  // Calculate total with delivery
  const deliveryCost = deliveryInfo.deliveryMethod === 'express' ? 1200 : 0;
  const finalTotal = calculations.total + deliveryCost;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentStatus.status === 'waiting' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            updatePaymentStatus({ status: 'timeout' });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStatus.status, countdown, updatePaymentStatus]);

  // Poll payment status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (paymentStatus.status === 'waiting' && paymentStatus.checkoutRequestId) {
      interval = setInterval(async () => {
        const status = await checkPaymentStatus(paymentStatus.checkoutRequestId!);
        
        if (status?.status === 'success') {
          updatePaymentStatus({ status: 'success' });
          clearCart();
          setStep(4);
        } else if (status?.status === 'failed') {
          updatePaymentStatus({ 
            status: 'failed',
            message: status.result_desc || 'Payment failed'
          });
        }
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentStatus.status, paymentStatus.checkoutRequestId, checkPaymentStatus, updatePaymentStatus, clearCart, setStep]);

  const handleMpesaPayment = async () => {
    const orderId = `ORD-${Date.now()}`;
    updatePaymentStatus({ status: 'processing' });

    try {
      // First create the order in the database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_id: orderId,
          email: customerDetails.email,
          phone_number: customerDetails.phone,
          status: 'pending',
          amount: finalTotal,
          items: selectedItems as any,
          shipping_address: `${deliveryInfo.address}, ${deliveryInfo.city}, ${deliveryInfo.county}`,
          first_name: customerDetails.firstName,
          last_name: customerDetails.lastName,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order:', orderError);
        updatePaymentStatus({
          status: 'failed',
          message: 'Failed to create order. Please try again.'
        });
        return;
      }

      // Then initiate M-Pesa payment
      const result = await initiatePayment({
        phone: customerDetails.phone,
        amount: finalTotal,
        orderId
      });

      if (result.success) {
        updatePaymentStatus({
          status: 'waiting',
          checkoutRequestId: result.checkoutRequestId,
          message: 'Check your phone and enter your M-Pesa PIN'
        });
        setCountdown(300); // Reset countdown
      } else {
        updatePaymentStatus({
          status: 'failed',
          message: result.error || 'Payment initiation failed'
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      updatePaymentStatus({
        status: 'failed',
        message: 'Payment failed. Please try again.'
      });
    }
  };

  const handleRetry = () => {
    updatePaymentStatus({ status: 'idle' });
    setCountdown(300);
  };

  const handleBack = () => {
    if (paymentStatus.status === 'processing' || paymentStatus.status === 'waiting') {
      if (window.confirm('Payment is in progress. Are you sure you want to go back?')) {
        updatePaymentStatus({ status: 'idle' });
        setStep(2);
      }
    } else {
      setStep(2);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Check Your Phone
              </h3>
              <p className="text-blue-700 mb-4">
                Enter your M-Pesa PIN to complete the payment
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm text-gray-600">Amount: KES {finalTotal.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Time remaining: {formatTime(countdown)}</p>
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
              <p className="text-green-700">
                Your payment has been processed successfully.
              </p>
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
              {calculations.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax (16%)</span>
                  <span>KES {calculations.tax.toLocaleString()}</span>
                </div>
              )}
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
          disabled={paymentStatus.status === 'processing'}
        >
          Back
        </Button>
      </div>
    </div>
  );
};
