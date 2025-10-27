<<<<<<< HEAD

import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export const OrderSummary = () => {
  const { calculations, getSelectedItems } = useSelectiveCart();
  const { deliveryInfo } = useCheckout();

  const selectedItems = getSelectedItems();
  const deliveryCost = deliveryInfo.deliveryMethod === 'express' ? 1200 : 500;
  const finalTotal = calculations.total - calculations.shipping + deliveryCost;

  return (
    <div className="h-full bg-gray-50">
      <Card className="h-full border-0 md:border bg-gray-50 md:bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {/* Selected Items - Scrollable on mobile */}
          <div className="order-items">
            <ScrollArea className="max-h-[25vh] md:max-h-60">
              <div className="space-y-3 pr-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 bg-white md:bg-gray-50 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {item.product.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-right">
                          KES {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Items ({calculations.selectedItemsCount})</span>
              <span>KES {calculations.subtotal.toLocaleString()}</span>
            </div>
            
            {deliveryInfo.deliveryMethod && (
              <div className="flex justify-between">
                <span>
                  Delivery ({deliveryInfo.deliveryMethod === 'express' ? 'Express' : 'Standard'})
                </span>
                <span>KES {deliveryCost.toLocaleString()}</span>
              </div>
            )}

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
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">KES {finalTotal.toLocaleString()}</span>
          </div>

          {/* Mobile: Additional padding for bottom fixed positioning */}
          <div className="h-6 md:h-0" />
        </CardContent>
      </Card>
    </div>
  );
};
=======

import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import { useCheckout } from '@/contexts/CheckoutContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export const OrderSummary = () => {
  const { calculations, getSelectedItems } = useSelectiveCart();
  const { deliveryInfo } = useCheckout();

  const selectedItems = getSelectedItems();
  const deliveryCost = deliveryInfo.deliveryMethod === 'express' ? 1200 : 500;
  const finalTotal = calculations.total - calculations.shipping + deliveryCost;

  return (
    <div className="h-full bg-gray-50">
      <Card className="h-full border-0 md:border bg-gray-50 md:bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          {/* Selected Items - Scrollable on mobile */}
          <div className="order-items">
            <ScrollArea className="max-h-[25vh] md:max-h-60">
              <div className="space-y-3 pr-3">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2 bg-white md:bg-gray-50 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 object-cover rounded border flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {item.product.name}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-medium text-right">
                          KES {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Price Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Items ({calculations.selectedItemsCount})</span>
              <span>KES {calculations.subtotal.toLocaleString()}</span>
            </div>
            
            {deliveryInfo.deliveryMethod && (
              <div className="flex justify-between">
                <span>
                  Delivery ({deliveryInfo.deliveryMethod === 'express' ? 'Express' : 'Standard'})
                </span>
                <span>KES {deliveryCost.toLocaleString()}</span>
              </div>
            )}

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
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span className="text-primary">KES {finalTotal.toLocaleString()}</span>
          </div>

          {/* Mobile: Additional padding for bottom fixed positioning */}
          <div className="h-6 md:h-0" />
        </CardContent>
      </Card>
    </div>
  );
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
