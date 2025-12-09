import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, ShoppingCart, User, List } from 'lucide-react';
import { useCartContext } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { isMobileUserAgent } from "@/hooks/use-mobile";

const MobileNav = () => {
  const location = useLocation();
  const isMobile = isMobileUserAgent();

  const showMobileNavOnPaths = ['/', '/category', '/chat', '/account', '/cart'];
  const showMobileNav = showMobileNavOnPaths.includes(location.pathname);
    
  let items: any[] = [];
  let totalItems = 0;
  
  try {
    const cartData = useCartContext();
    items = cartData.cartItems || [];
    totalItems = items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Cart context not available:', error);
    items = [];
    totalItems = 0;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: List, label: 'Category', path: '/category' },
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
    <>
      {showMobileNav && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border w-full z-50 safe-area-inset-bottom">
          <div className="flex justify-around items-center py-2">
            {navItems.map(({ icon: Icon, label, path, count }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex flex-col items-center px-3 py-1 relative transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                    {(count ?? 0) > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] font-semibold"
                      >
                        {count}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 ${isActive ? 'font-medium' : ''}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
