
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, ShoppingCart, User, List } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from "@/hooks/use-mobile";

const MobileNav = () => {
  const location = useLocation();
  const isMobile = isMobileUserAgent();
    
  // Safely get cart data with fallback
  let items: any[] = [];
  let totalItems = 0;
  
  try {
    const cartData = useCart();
    items = cartData.cartItems || [];
    totalItems = items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Cart context not available:', error);
    // Fallback to empty cart if context is not available
    items = [];
    totalItems = 0;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: List, label: 'Category', path: '/products' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { 
      icon: ShoppingCart, 
      label: 'Cart', 
      path: '/cart', 
      count: totalItems
    },
    { icon: User, label: 'Account', path: '/account' },
  ];

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center pt-1">
        {navItems.map(({ icon: Icon, label, path, count }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center px-3 relative ${
              location.pathname === path
                ? 'text-orange-500'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="relative">
              <Icon className="w-6 h-6" />
              {(count ?? 0) > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {count}
                </Badge>
              )}
            </div>
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
