import { useEffect, useCallback, useMemo } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import CartSkeleton from '@/components/cart/CartSkeleton';
import MobileNav from '@/components/MobileNav';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useShippingSettings } from '@/hooks/useShippingSettings';

const CartPage = () => {
  const { cartItems, loading, isCartEmpty, refetch } = useCartContext();
  const { 
    selectedItems, 
    isAllSelected, 
    isIndeterminate,
    toggleSelectAll,
    calculations 
  } = useSelectiveCart();
  
  const isMobile = isMobileUserAgent();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);
  const { freeShippingThreshold } = useShippingSettings();

  // Refetch cart data when component mounts to ensure fresh data
  useEffect(() => {
    console.log('CartPage mounted, refetching cart data');
    refetch();
  }, [refetch]);

  // Memoized handlers
  const handleSelectAll = useCallback((selectAll: boolean) => {
    toggleSelectAll();
  }, [toggleSelectAll]);

  const handleCheckout = async () => {
    try {
      setIsNavigating(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      if (user) {
        navigate('/checkout');
      } else {
        navigate('/auth');
      }
    } catch (err) {
      console.error('Checkout navigation error:', err);
    } finally {
      setIsNavigating(false);
    }
  };

  // Memoized cart summary data
  const cartSummaryData = useMemo(() => ({
    totalItems: cartItems.length,
    selectedCount: selectedItems.length,
    calculations
  }), [cartItems.length, selectedItems.length, calculations]);

  if (loading) {
    return <CartSkeleton />;
  }

  if (isCartEmpty) {
    return (
      <div className="min-h-screen flex flex-col">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className={`bg-white ${!isMobile ? 'min-w-max' : ''}`}>
      <div className={`flex-grow mx-auto ${!isMobile ? 'container px-0 xl:px-24' : 'pb-32 px-2 py-6'}`}>
        <div className={`${!isMobile ? 'shadow-md p-8' : ''}`}>
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shopping Cart
            </h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              {selectedItems.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({selectedItems.length} selected)
                </span>
              )}
            </p>
          </div>
        )}

        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1 .lg:grid-cols-3' : 'grid-cols-2'}`}>
          {/* Cart Items */}
          <div className=".lg:col-span-2">
            <div className="bg-white shadow-sm">
              <CartHeader
                totalItems={cartItems.length}
                selectedCount={selectedItems.length}
                onSelectAll={handleSelectAll}
                allSelected={isAllSelected}
              />
              
              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <SelectableCartItem
                    key={item.id}
                    item={item}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Cart Summary - Desktop Only */}
          {!isMobile && (
            <div className=".lg:col-span-1">
              <CartSummary />
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      {isMobile && calculations.selectedItemsCount > 0 && (
        <div className="fixed bottom-8 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="container mx-auto px-4 py-2">
            {/* Totals Row */}
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-md text-red-500">
                  <span className='text-gray-900'>Total: </span>
                  KES {calculations.total.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isNavigating}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold px-2 h-8"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            
            {/* Free Delivery Indicator */}
            {calculations.subtotal < freeShippingThreshold && (
              <p className="text-xs text-center text-gray-500">
                Add KES {(freeShippingThreshold - calculations.subtotal).toLocaleString()} more for free delivery
              </p>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
};

export default CartPage;