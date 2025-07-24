import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useNavigate } from 'react-router-dom'; // Add this import
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, ArrowRight } from 'lucide-react';

const CartSummary = () => {
  const { calculations } = useSelectiveCart();
  const navigate = useNavigate(); // Add this hook

  const handleCheckout = () => {
    // Navigate to checkout page instead of opening modal
    navigate('/checkout');
  };

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

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">KES {calculations.subtotal.toLocaleString()}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium">KES 0</span>
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
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          size="lg"
        >
          Proceed to Checkout
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Free delivery on orders over KES 2,000
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartSummary;