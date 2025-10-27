<<<<<<< HEAD

import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuccessStep = () => {
  const { customerDetails, orderId, closeCheckout } = useCheckout();
  const navigate = useNavigate();

  const handleViewOrders = () => {
    closeCheckout();
    navigate(`order/${orderId}`);
  };

  const handleContinueShopping = () => {
    closeCheckout();
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">
          Your order has been confirmed and will be processed shortly.
        </p>
      </div>

      {orderId && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-medium">{orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Confirmation sent to</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{customerDetails.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{customerDetails.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Button 
          onClick={handleViewOrders} 
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          View Order Details
        </Button>
        <Button 
          variant="outline" 
          onClick={handleContinueShopping}
          className="w-full"
        >
          Continue Shopping
        </Button>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>You will receive order updates via email.</p>
        <p>For any questions, contact our support team.</p>
      </div>
    </div>
  );
};
=======

import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Download, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SuccessStep = () => {
  const { customerDetails, orderId, closeCheckout } = useCheckout();
  const navigate = useNavigate();

  const handleViewOrders = () => {
    closeCheckout();
    navigate(`order/${orderId}`);
  };

  const handleContinueShopping = () => {
    closeCheckout();
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
        <p className="text-gray-600">
          Your order has been confirmed and will be processed shortly.
        </p>
      </div>

      {orderId && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="font-mono font-medium">{orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Confirmation sent to</p>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>{customerDetails.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" />
                  <span>{customerDetails.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Button 
          onClick={handleViewOrders} 
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          View Order Details
        </Button>
        <Button 
          variant="outline" 
          onClick={handleContinueShopping}
          className="w-full"
        >
          Continue Shopping
        </Button>
      </div>

      <div className="text-sm text-gray-500 space-y-1">
        <p>You will receive order updates via email.</p>
        <p>For any questions, contact our support team.</p>
      </div>
    </div>
  );
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
