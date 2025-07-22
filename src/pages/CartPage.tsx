
import { useEffect, useCallback } from 'react';
import { useCart } from '@/hooks/useCart';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import VirtualizedCartItems from '@/components/cart/VirtualizedCartItems';
import CartSummary from '@/components/cart/CartSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { Separator } from '@/components/ui/separator';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { ShoppingBag } from 'lucide-react';
import MobileNav from '@/components/MobileNav';
import CartSkeleton from '@/components/cart/CartSkeleton';

const CartPage = () => {
  const { cartItems, loading } = useCart();
  const { selectedItems, toggleItemSelection, selectAllItems, calculations } = useSelectiveCart();
  const isMobile = isMobileUserAgent();

  // Memoize the auto-select function to prevent unnecessary re-renders
  const autoSelectItems = useCallback(() => {
    if (!loading && cartItems.length > 0 && selectedItems.length === 0) {
      // Use selectAllItems instead of individual toggles for better performance
      selectAllItems();
    }
  }, [loading, cartItems.length, selectedItems.length, selectAllItems]);

  // Auto-select all items when cart loads (only once)
  useEffect(() => {
    autoSelectItems();
  }, [autoSelectItems]);

  // Memoize the select all handler
  const handleSelectAll = useCallback((selectAll) => {
    if (selectAll) {
      selectAllItems();
    } else {
      cartItems.forEach(item => {
        if (selectedItems.includes(item.id)) {
          toggleItemSelection(item.id);
        }
      });
    }
  }, [cartItems, selectedItems, selectAllItems, toggleItemSelection]);

  if (loading) {
    return <CartSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && <MobileHeader 
        title="Shopping Cart"
        rightAction={
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ShoppingBag className="h-4 w-4" />
            <span>{cartItems.length}</span>
          </div>
        }
      />}

      <div className="container mx-auto px-4 py-6">
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
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
                allSelected={selectedItems.length === cartItems.length}
              />
              
              {/* Use virtualized list for large carts (20+ items) or regular rendering for smaller carts */}
              {cartItems.length >= 20 ? (
                <VirtualizedCartItems
                  cartItems={cartItems}
                  selectedItems={selectedItems}
                  toggleItemSelection={toggleItemSelection}
                  height={600}
                  itemHeight={140}
                />
              ) : (
                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <SelectableCartItem
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.includes(item.id)}
                      onToggleSelect={() => toggleItemSelection(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
      <MobileNav/>
    </div>
  );
};

export default CartPage;