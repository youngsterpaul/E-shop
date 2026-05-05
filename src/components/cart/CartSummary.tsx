import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useShippingSettings } from '@/hooks/useShippingSettings';

const CartSummary = () => {
  const { calculations } = useSelectiveCart();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const { freeShippingThreshold, isLoading: settingsLoading } = useShippingSettings();

  const handleCheckout = async () => {
    try {
      setIsNavigating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      if (user) {
        navigate('/checkout');
      } else if (!user) {
        navigate('/auth');
      }
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

  const isEligibleForFreeDelivery = calculations.subtotal >= (freeShippingThreshold || 0);
  const amountNeededForFreeDelivery = (freeShippingThreshold || 0) - calculations.subtotal;

  return (
    <Card className="sticky top-6 mx-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 mx-0 px-[20px] my-0">
        {/* Selected Items Count */}
        <div className="flex justify-between text-sm px-0">
          <span className="text-gray-600">
            {calculations.selectedItemsCount} item{calculations.selectedItemsCount !== 1 ? 's' : ''} selected
          </span>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">KES {calculations.subtotal.toLocaleString()}</span>
          </div>

          {/* ✅ Delivery — always "Calculated at checkout" */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Delivery</span>
            <span className="text-sm font-medium text-muted-foreground italic">
              Calculated at checkout
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

        {/* Total (subtotal minus discount, delivery excluded) */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-xl font-bold text-orange-600">
            KES {Math.max(0, calculations.subtotal - calculations.discount).toLocaleString()}
          </span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          disabled={isNavigating}
          className="w-full flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-none"
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
      </CardContent>
    </Card>
  );
};

export default CartSummary;