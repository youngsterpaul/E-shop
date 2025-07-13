
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  ShoppingCart, 
  User, 
  Menu as MenuIcon,
  X,
  Home,
  Package,
  LogOut,
  Settings,
  MapPin,
  ShoppingBag,
  Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Main navigation items for sitelinks
  const mainNavItems = [
    { label: 'Categories', href: '/products', description: 'Browse all product categories' },
    { label: 'Best Sellers', href: '/bestsellers', description: 'Top selling products' },
    { label: 'Customer Service', href: '/contact', description: 'Get help and support' },
    { label: 'Track Order', href: '/orders', description: 'Track your orders' },
    { label: 'About Us', href: '/about', description: 'Learn more about SmartKenya' },
  ];

  return (
    <>
      {/* Enhanced Schema for better sitelinks */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://smartkenya.co.ke",
          "name": "SmartKenya Online Shopping",
          "alternateName": "SmartKenya",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://smartkenya.co.ke/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          },
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://smartkenya.co.ke"
          }
        })}
      </script>

      <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Main navigation for desktop - important for sitelinks */}
      {!isMobile && (
        <nav className="block bg-gray-50 border-b" role="navigation" aria-label="Main Navigation">
          <div className="container mx-auto px-4">
            <ul className="flex items-center justify-center space-x-8 py-2">
              {mainNavItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    to={item.href}
                    className="text-sm text-gray-700 hover:text-orange-500 transition-colors"
                    title={item.description}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        )}


        <div className={`container px-4 mx-auto ${isMobile ? 'py-2' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800">SmartKenya</h1>
            </Link>
            
            {/* Desktop Search */}
            {!isMobile && (
              <>
              <form onSubmit={handleSearch} className="flex flex-1 mx-4 lg:mx-8 relative">
                <Input
                  type="search"
                  placeholder="Search for products..."
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  className="absolute right-0"
                >
                  <SearchIcon className="h-4 w-4" />
                </Button>
              </form>
            
            <div className="flex items-center space-x-4">
              <Link to="/cart" className="relative text-gray-700 hover:text-primary transition-colors">
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              <Button 
                onClick={() => navigate('/products')}
                variant="ghost" 
                className="px-2 flex"
              >
                Shop Now
              </Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="px-2 hidden md:flex">
                      <User className="h-6 w-6" /> Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-2 py-1.5 text-sm font-medium">
                      {profile?.first_name && profile?.last_name ? (
                        <p>{profile.first_name} {profile.last_name}</p>
                      ) : (
                        <p>{user.email}</p>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" /> Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders" className="cursor-pointer flex items-center">
                        <ShoppingBag className="mr-2 h-4 w-4" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/shipping" className="cursor-pointer flex items-center">
                        <MapPin className="mr-2 h-4 w-4" /> Shipping Addresses
                      </Link>
                    </DropdownMenuItem>
                    {profile?.is_admin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer flex items-center">
                          <Settings className="mr-2 h-4 w-4" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button 
                        onClick={handleLogout} 
                        className="cursor-pointer flex items-center w-full"
                      >
                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  className="px-2"
                  onClick={() => navigate('/auth/signin')}
                >
                  <User className="h-6 w-6" /> Sign In
                </Button>
              )}
            </div>  
             </>
            )}          
          </div>
         
        </div>     
      </header>
    </>
  );
};

export default Header;
