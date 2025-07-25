import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';

const CartSummary = () => {
  const { calculations } = useSelectiveCart();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsNavigating(true);
      // Add any pre-checkout validation here
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate async operation
      navigate('/checkout');
    } catch (err) {
      console.error('Checkout navigation error:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  // Empty state
  if (calculations.selectedItemsCount === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No items selected</p>
          <p className="text-sm text-gray-400">Select items to see summary</p>
        </CardContent>
      </Card>
    );
  }

  const freeDeliveryThreshold = 2000;
  const isEligibleForFreeDelivery = calculations.subtotal >= freeDeliveryThreshold;
  const amountNeededForFreeDelivery = freeDeliveryThreshold - calculations.subtotal;

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Items Count */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {calculations.selectedItemsCount} item{calculations.selectedItemsCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Free delivery progress */}
        {!isEligibleForFreeDelivery && amountNeededForFreeDelivery > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              Add KES {amountNeededForFreeDelivery.toLocaleString()} more for free delivery!
            </p>
            <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((calculations.subtotal / freeDeliveryThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

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
              <span className="text-gray-600">Tax (16%)</span>
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

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-xl font-bold text-orange-600">
            KES {calculations.total.toLocaleString()}
          </span>
        </div>

        {/* Checkout Button */}
        <Button 
          onClick={handleCheckout}
          disabled={isNavigating}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold transition-all duration-200"
          size="lg"
        >
          {isNavigating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              Proceed to Checkout
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {isEligibleForFreeDelivery 
              ? "🎉 You qualify for free delivery!" 
              : "Free delivery on orders over KES 2,000"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;