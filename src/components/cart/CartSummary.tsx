
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

const CartSummary = () => {
  const { 
    calculations, 
    shippingOption, 
    setShippingOption, 
    appliedCoupons,
    applyCoupon,
    removeCoupon 
  } = useSelectiveCart();
  
  const { openCheckout } = useCheckout();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const shippingOptions = [
    { id: 'standard', name: 'Standard Delivery', price: 0, estimatedDays: '1-3 hours' },
    //{ id: 'express', name: 'Express Delivery', price: 1200, estimatedDays: '4-6 hours' },
  ];

  // Auto-select first shipping option if none is selected
  useEffect(() => {
    if (!shippingOption && shippingOptions.length > 0) {
      setShippingOption(shippingOptions[0]);
    }
  }, [shippingOption, setShippingOption]);

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return;

    // Mock coupon validation
    const mockCoupons = {
      'SAVE10': { id: 'SAVE10', code: 'SAVE10', discount: 10, type: 'percentage' as const },
      'WELCOME50': { id: 'WELCOME50', code: 'WELCOME50', discount: 500, type: 'fixed' as const, minAmount: 2000 },
    };

    const coupon = mockCoupons[couponCode.toUpperCase() as keyof typeof mockCoupons];
    
    if (coupon) {
      if ('minAmount' in coupon && coupon.minAmount && calculations.subtotal < coupon.minAmount) {
        setCouponError(`Minimum order amount of KES ${coupon.minAmount.toLocaleString()} required`);
        return;
      }
      
      applyCoupon(coupon);
      setCouponCode('');
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code');
    }
  };

  const handleCheckout = () => {
    if (calculations.selectedItemsCount === 0) {
      return;
    }
    openCheckout();
  };

  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shipping Options */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Shipping Method</Label>
          <RadioGroup
            value={shippingOption?.id}
            onValueChange={(value) => {
              const option = shippingOptions.find(opt => opt.id === value);
              if (option) setShippingOption(option);
            }}
          >
            {shippingOptions.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="text-sm">
                    {option.name}
                  </Label>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">KES {option.price.toLocaleString()}</p>
                  <p className="text-gray-500">{option.estimatedDays}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator />

        {/* Coupon Section */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Promo Code</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
            />
            <Button variant="outline" onClick={handleApplyCoupon} size="sm">
              Apply
            </Button>
          </div>
          {couponError && (
            <p className="text-sm text-red-600 mt-1">{couponError}</p>
          )}
          
          {/* Applied Coupons */}
          {appliedCoupons.map((coupon) => (
            <div key={coupon.id} className="mt-2 flex items-center justify-between bg-green-50 p-2 rounded">
              <span className="text-sm font-medium text-green-800">{coupon.code}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCoupon(coupon.id)}
                className="h-6 text-green-800 hover:text-red-600"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal ({calculations.selectedItemsCount} items)</span>
            <span>KES {calculations.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>KES {calculations.shipping.toLocaleString()}</span>
          </div>
          {calculations.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax (16%)</span>
              <span>KES {calculations.tax.toLocaleString()}</span>
            </div>
          )}
          {calculations.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-KES {calculations.discount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>KES {calculations.total.toLocaleString()}</span>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={calculations.selectedItemsCount === 0}
          className="w-full bg-orange-500 hover:bg-orange-600"
          size="lg"
        >
          Proceed to Checkout ({calculations.selectedItemsCount})
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Secure checkout powered by M-Pesa
        </p>
      </CardContent>
    </Card>
  );
};

export default CartSummary;