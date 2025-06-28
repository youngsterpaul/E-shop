
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, Heart, User, Menu, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p>Free shipping on orders over KSh 2,000</p>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/contact" className="hover:underline">Help</Link>
            <Link to="/auth/signin" className="hover:underline">Sell on SmartKenya</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <span className="font-bold text-xl">SK</span>
            </div>
            <span className="font-bold text-xl text-primary hidden sm:block">SmartKenya</span>
          </Link>

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products, brands and categories"
                  className="w-full pl-4 pr-12 py-3 rounded-lg border-2 border-gray-200 focus:border-primary"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1 bottom-1 px-4"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {isMobile && (
              <Button variant="ghost" size="sm">
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            <Link to="/account">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <User className="h-5 w-5" />
                {!isMobile && <span>Account</span>}
              </Button>
            </Link>

            <Link to="/wishlist">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                <Heart className="h-5 w-5" />
                {!isMobile && <span>Wishlist</span>}
              </Button>
            </Link>

            <Link to="/cart">
              <Button variant="ghost" size="sm" className="flex items-center space-x-1 relative">
                <ShoppingCart className="h-5 w-5" />
                {!isMobile && <span>Cart</span>}
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Button>
            </Link>

            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        {isMobile && (
          <div className="mt-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full pl-4 pr-12 py-2 rounded-lg border-2 border-gray-200 focus:border-primary"
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 bottom-1 px-3"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Categories Navigation */}
      <nav className="bg-gray-50 border-t">
        <div className="container mx-auto px-4">
          <div className={`${isMobile ? 'overflow-x-auto scrollbar-hide' : ''}`}>
            <div className={`flex ${isMobile ? 'space-x-6 py-3 min-w-max' : 'space-x-8 py-4 justify-center'}`}>
              <Link to="/products?category=electronics" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Electronics
              </Link>
              <Link to="/products?category=phones" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Phones
              </Link>
              <Link to="/products?category=computers" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Computers
              </Link>
              <Link to="/products?category=home" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Home & Garden
              </Link>
              <Link to="/products?category=fashion" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Fashion
              </Link>
              <Link to="/products?category=sports" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Sports
              </Link>
              <Link to="/products?category=beauty" className="text-sm font-medium hover:text-primary transition-colors whitespace-nowrap">
                Beauty
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
