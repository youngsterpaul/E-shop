
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
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import EnhancedSearchInput from './search/EnhancedSearchInput';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = isMobileUserAgent();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
   useEffect(() => {
     // Extract search query from URL
     const params = new URLSearchParams(location.search);
     const queryParam = params.get('q');
     if (queryParam) {
       setSearchQuery(queryParam);
     }
   }, [location.search]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Update URL with search query
    const params = new URLSearchParams();
    if (query) {
      params.set('q', query);
    }
    
    navigate(`/search?${params.toString()}`);
  };
  
  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Main navigation items for sitelinks
  const mainNavItems = [
    { label: 'Home', href: '/', description: 'Return to homepage' },
    { label: 'Customer Service', href: '/contact', description: 'Get help and support' },
    { label: 'Track Order', href: '/orders', description: 'Track your orders' },
    { label: 'About Us', href: '/about', description: 'Learn more about SmartKenya' },
    { label: 'Careers', href: '/careers', description: 'Get your dream job at smartkenya' },
    { label: 'FAQs', href: '/faq', description: 'Get answers to most asked questions' },
    { label: 'Privacy Policy', href: '/privacy', description: 'Know your privacy at smartkenya' },
    { label: 'T&C', href: '/terms', description: 'Terms and Conditions of Smartkenya' },
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

      <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Main navigation for desktop - important for sitelinks */}


        <div className={`container px-0 mx-auto ${isMobile ? 'py-2 border-b border-gray-200' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800">SmartKenya</h1>
            </Link>
            
            {/* Desktop Search */}
            {!isMobile && (
              <>
              <div className="flex flex-1 mx-4 lg:mx-8 relative">
                <EnhancedSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  placeholder="Search for products, brands, or categories..."
                  className="w-full"
                />
              </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/cart" aria-label='View Cart' className="relative text-gray-700 hover:text-primary transition-colors">
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Link>

              {isMobile && (
                <Link to="/search">
                  <Button variant="ghost" size="sm" className="p-2">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              
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
          {isMobile && (
          <div className="flex items-center space-x-4">
            <Link to="/search">
              <Button variant="ghost" size="sm" className="p-2" aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}           
          </div>
        </div>   

        {!isMobile && (
        <nav className="block bg-gray-50 /border-b" role="navigation" aria-label="Main Navigation">
          <div className="container mx-auto px-0">
            <ul className="flex items-center /justify-center space-x-8 pt-2 pb-4">
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
      </header>
    </>
  );
};

export default Header;
