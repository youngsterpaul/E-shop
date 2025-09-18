
import { useEffect, useCallback, useMemo } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { ShoppingBag } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import CartSkeleton from '@/components/cart/CartSkeleton';
import Footer from '@/components/Footer';

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

  // Refetch cart data when component mounts to ensure fresh data
  useEffect(() => {
    console.log('CartPage mounted, refetching cart data');
    refetch();
  }, [refetch]);

  // Memoized handlers
  const handleSelectAll = useCallback((selectAll: boolean) => {
    toggleSelectAll();
  }, [toggleSelectAll]);

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
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
          title="Shopping Cart"
          rightAction={
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              <span>{cartItems.length}</span>
            </div>
          }
        />
      )}

      <div className={`container mx-auto px-4 py-6 ${!isMobile ? 'xl:px-24' : ''}`}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>

          
        </div>
      </div>
      {!isMobile && <Footer />}
      <MobileNav />
    </div>
  );
};

export default CartPage;