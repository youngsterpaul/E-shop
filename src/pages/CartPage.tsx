
import { useCart } from '@/hooks/useCart';
import { useSelectiveCart } from '@/contexts/SelectiveCartContext';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import CartHeader from '@/components/cart/CartHeader';
import SelectableCartItem from '@/components/cart/SelectableCartItem';
import CartSummary from '@/components/cart/CartSummary';
import CartSkeleton from '@/components/cart/CartSkeleton';
import ModernEmptyCart from '@/components/cart/ModernEmptyCart';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { ShoppingBag } from 'lucide-react';
import MobileNav from '@/components/MobileNav';

const CartPage = () => {
  const { cartItems, loading } = useCart();
  const { selectedItems, toggleItemSelection, calculations } = useSelectiveCart();
  const isMobile = useIsMobile();

  if (loading) {
    return <CartSkeleton />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        {!isMobile && <Header />}
        <MobileHeader 
          title="Shopping Cart"
          backTo="/products"
          rightAction={
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <ShoppingBag className="h-4 w-4" />
              <span>0</span>
            </div>
          }
        />
        <ModernEmptyCart />
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isMobile && <Header />}
      <MobileHeader 
        title="Shopping Cart"
        backTo="/products"
        rightAction={
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <ShoppingBag className="h-4 w-4" />
            <span>{cartItems.length}</span>
          </div>
        }
      />

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
                onSelectAll={(selectAll) => {
                  cartItems.forEach(item => {
                    if (selectAll && !selectedItems.includes(item.id)) {
                      toggleItemSelection(item.id);
                    } else if (!selectAll && selectedItems.includes(item.id)) {
                      toggleItemSelection(item.id);
                    }
                  });
                }}
                allSelected={selectedItems.length === cartItems.length}
              />
              
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
