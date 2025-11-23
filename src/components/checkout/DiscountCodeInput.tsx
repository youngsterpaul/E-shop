import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, Loader2, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { Badge } from '@/components/ui/badge';

interface Discount {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  applies_to: string;
  product_ids: string[] | null;
  category_ids: number[] | null;
}

export const DiscountCodeInput = () => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { applyCoupon, removeCoupon, appliedCoupons, calculations } = useSelectiveCart();

  const validateAndApplyDiscount = async () => {
    if (!code.trim()) {
      toast.error('Please enter a discount code');
      return;
    }

    setIsValidating(true);
    try {
      // Query the discounts table
      const { data: discount, error } = await supabase
        .from('discounts')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !discount) {
        toast.error('Invalid discount code');
        setIsValidating(false);
        return;
      }

      // Check if discount has already been applied
      if (appliedCoupons.find(c => c.id === discount.id)) {
        toast.info('This discount code has already been applied');
        setIsValidating(false);
        return;
      }

      // Check date validity
      const now = new Date();
      const startDate = new Date(discount.start_date);
      const endDate = discount.end_date ? new Date(discount.end_date) : null;

      if (now < startDate) {
        toast.error('This discount code is not yet active');
        setIsValidating(false);
        return;
      }

      if (endDate && now > endDate) {
        toast.error('This discount code has expired');
        setIsValidating(false);
        return;
      }

      // Check minimum purchase requirement
      if (discount.min_purchase_amount && calculations.subtotal < discount.min_purchase_amount) {
        toast.error(`Minimum purchase of KES ${discount.min_purchase_amount.toLocaleString()} required`);
        setIsValidating(false);
        return;
      }

      // Check usage limit
      if (discount.usage_limit && (discount.usage_count ?? 0) >= discount.usage_limit) {
        toast.error('This discount code has reached its usage limit');
        setIsValidating(false);
        return;
      }

      // Calculate discount amount
      let discountAmount = 0;
      if (discount.discount_type === 'percentage') {
        discountAmount = (calculations.subtotal * discount.discount_value) / 100;
        // Apply max discount cap if specified
        if (discount.max_discount_amount) {
          discountAmount = Math.min(discountAmount, discount.max_discount_amount);
        }
      } else {
        discountAmount = discount.discount_value;
      }

      // Apply the coupon
      applyCoupon({
        id: discount.id,
        code: discount.code,
        discount: discountAmount,
        type: discount.discount_type as 'percentage' | 'fixed',
        description: `${discount.discount_type === 'percentage' ? `${discount.discount_value}%` : `KES ${discount.discount_value}`} off`
      });

      toast.success(`Discount code "${discount.code}" applied!`);
      setCode('');
    } catch (error) {
      console.error('Error validating discount:', error);
      toast.error('Failed to validate discount code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = (couponId: string, couponCode: string) => {
    removeCoupon(couponId);
    toast.success(`Discount code "${couponCode}" removed`);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter discount code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && validateAndApplyDiscount()}
            className="pl-10"
            disabled={isValidating}
          />
        </div>
        <Button
          onClick={validateAndApplyDiscount}
          disabled={isValidating || !code.trim()}
          variant="outline"
          className="px-6"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </div>

      {/* Applied coupons */}
      {appliedCoupons.length > 0 && (
        <div className="space-y-2">
          {appliedCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{coupon.code}</p>
                  <p className="text-xs text-green-700">{coupon.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCoupon(coupon.id, coupon.code)}
                className="h-6 w-6 p-0 text-green-700 hover:text-green-900 hover:bg-green-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
