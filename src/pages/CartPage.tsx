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
  const isEligibleForFreeDelivery = calculations.subtotal >= (freeShippingThreshold || 0);

  // Refetch cart data when component mounts - but only once
  useEffect(() => {
    // Only refetch if cart is actually empty or stale
    if (cartItems.length === 0) {
      refetch();
    }
  }, []); // Empty deps - only on mount

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
    <div className={`min-h-screen mb-10 w-full bg-white ${!isMobile ? 'min-w-max' : ''}`}>
      <div className={`${!isMobile ? 'container mx-auto px-4 xl:px-24 py-8' : 'pb-36 px-2 pt-2 pb-6'}`}>
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              Shopping Cart
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              {selectedItems.length > 0 && (
                <span className="ml-2 text-primary font-medium">
                  ({selectedItems.length} selected)
                </span>
              )}
            </p>
          </div>
        )}

        <div className={`flex ${isMobile ? 'flex-col' : 'justify-between'} gap-8`}>
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
            <div className=".lg:col-span-1 max-w-[400px]">
              <CartSummary />
            </div>
          )}
      </div>
    </div>

      {/* Mobile Fixed Bottom Bar */}
      {isMobile && calculations.selectedItemsCount > 0 && (
        <>
        <div className="fixed bottom-20 left-0 right-0 bg-white px-2 border-t border-gray-200 shadow-lg justify-between">
          <div className="flex justify-between">
            <div>
              <span className="text-gray-600 text-xs">Subtotal: </span>
              <span className="text-xs text-red-500">KES {calculations.subtotal.toLocaleString()}</span>
            </div>
            <div className=''>
              <span className="text-xs">Delivery: </span>
              <span className={`text-xs text-red-500 ${isEligibleForFreeDelivery ? 'text-green-600' : ''}`}>
                {calculations.shipping > 0 ? `KES ${calculations.shipping.toLocaleString()}` : 
                  isEligibleForFreeDelivery ? 'FREE' : 'KES 0'}
              </span>
            </div>
            </div>
          </div>

        <div className="fixed bottom-8 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
          <div className="container mx-auto px-2 py-1">    
            {/* Totals Row */}
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-red-500">
                  <span className='text-gray-900'>Total: </span>
                  KES {calculations.total.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isNavigating}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm px-2 h-8"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    Checkout
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
          
        </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
