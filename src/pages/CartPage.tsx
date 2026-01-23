import { useEffect, useCallback, useMemo } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import CartSkeleton from '@/components/cart/CartSkeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, ShoppingBag, Shield, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useShippingSettings } from '@/hooks/useShippingSettings';

const CartPage = () => {
  const { cartItems, loading, isCartEmpty, refetch } = useCartContext();
  const { 
    selectedItems, 
    isAllSelected, 
    toggleSelectAll,
    calculations 
  } = useSelectiveCart();
  
  const isMobile = isMobileUserAgent();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const { freeShippingThreshold } = useShippingSettings();
  const isEligibleForFreeDelivery = calculations.subtotal >= (freeShippingThreshold || 0);
  const amountToFreeShipping = Math.max(0, (freeShippingThreshold || 0) - calculations.subtotal);

  useEffect(() => {
    if (cartItems.length === 0) {
      refetch();
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    toggleSelectAll();
  }, [toggleSelectAll]);

  const handleCheckout = async () => {
    try {
      setIsNavigating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate(user ? '/checkout' : '/auth');
    } catch (err) {
      console.error('Checkout navigation error:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  if (loading) return <CartSkeleton />;
  if (isCartEmpty) return <div className='min-w-max'><EmptyCart /></div>;

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <div className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-8' : 'px-0 pt-0 pb-40'}`}>
        
        {/* Page Header - Desktop */}
        {!isMobile && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Shopping Cart</h1>
                <p className="text-muted-foreground">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  {selectedItems.length > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      • {selectedItems.length} selected
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'gap-6'}`}>
          {/* Cart Items */}
          <div className={`${!isMobile ? 'flex-1' : ''}`}>
            <div className="bg-card rounded-xl shadow-sm overflow-hidden">
              <CartHeader
                totalItems={cartItems.length}
                selectedCount={selectedItems.length}
                onSelectAll={handleSelectAll}
                allSelected={isAllSelected}
              />
              
              <div className="divide-y divide-border">
                {cartItems.map((item) => (
                  <SelectableCartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Trust Badges - Desktop */}
            {!isMobile && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Secure Checkout</p>
                    <p className="text-xs text-muted-foreground">SSL Encrypted</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Fast Delivery</p>
                    <p className="text-xs text-muted-foreground">Nationwide shipping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-card rounded-lg">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Easy Returns</p>
                    <p className="text-xs text-muted-foreground">7-day return policy</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Summary - Desktop */}
          {!isMobile && (
            <div className="w-[380px] flex-shrink-0">
              <div className="sticky top-4">
                <CartSummary />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      {isMobile && calculations.selectedItemsCount > 0 && (
        <div className="fixed bottom-14 left-0 right-0 bg-card border-t border-border shadow-lg z-40">
          {/* Free Shipping Progress */}
          {!isEligibleForFreeDelivery && amountToFreeShipping > 0 && (
            <div className="px-3 py-1.5 bg-primary/5 border-b border-border">
              <p className="text-[11px] text-muted-foreground text-center">
                Add <span className="font-semibold text-primary">KES {amountToFreeShipping.toLocaleString()}</span> more for free delivery
              </p>
            </div>
          )}
          
          <div className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">KES {calculations.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">
                    KES {calculations.total.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className={`text-[10px] font-medium ${isEligibleForFreeDelivery ? 'text-primary' : 'text-muted-foreground'}`}>
                  Delivery: {isEligibleForFreeDelivery ? 'FREE' : `KES ${calculations.shipping.toLocaleString()}`}
                </span>
                <Button
                  onClick={handleCheckout}
                  disabled={isNavigating}
                  size="sm"
                  className="h-9 px-5 text-sm"
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      <span className="text-xs">Processing...</span>
                    </>
                  ) : (
                    <>
                      Checkout
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;