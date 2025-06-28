
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Heart, User } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
      <div className="flex justify-around py-2">
        <Link
          to="/"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </Link>

        <Link
          to="/search"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/search') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs mt-1">Search</span>
        </Link>

        <Link
          to="/cart"
          className={`flex flex-col items-center py-2 px-3 relative ${
            isActive('/cart') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="text-xs mt-1">Cart</span>
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
            0
          </span>
        </Link>

        <Link
          to="/wishlist"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/wishlist') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <Heart className="h-5 w-5" />
          <span className="text-xs mt-1">Wishlist</span>
        </Link>

        <Link
          to="/account"
          className={`flex flex-col items-center py-2 px-3 ${
            isActive('/account') ? 'text-primary' : 'text-gray-500'
          }`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Account</span>
        </Link>
      </div>
    </nav>
  );
};

export default MobileNav;
