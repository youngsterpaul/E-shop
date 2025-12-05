import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Settings, ShoppingBag, Search, Heart } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCartContext } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import EnhancedSearchInput from './search/EnhancedSearchInput';
import smartkenyaLogo from '@/assets/images/smartkenya-logo.png';
import { useUserRole } from '@/hooks/useUserRole';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, isModerator } = useUserRole(user?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = isMobileUserAgent();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Safely get cart data with fallback
  let items: any[] = [];
  let totalItems = 0;
  const [showTopHeader, setShowTopHeader] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const hideMainHeaderOnPaths = ['/privacy', '/careers', '/contact', '/returns', '/faq', '/terms', '/about'];
  const hideMainHeader = hideMainHeaderOnPaths.includes(location.pathname);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY === 0) {
        setShowTopHeader(true);
        setShowBottomNav(true);
      } else if (currentScrollY > lastScrollY) {
        setShowTopHeader(true);
        setShowBottomNav(false);
      } else {
        setShowTopHeader(false);
        setShowBottomNav(false);
      }
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  try {
    const cartData = useCartContext();
    items = cartData.cartItems || [];
    totalItems = items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Cart context not available:', error);
    items = [];
    totalItems = 0;
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
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

  const mainNavItems = [
    { label: 'Home', href: '/', description: 'Return to homepage' },
    { label: 'Customer Service', href: '/contact', description: 'Get help and support' },
    { label: 'Track Order', href: '/orders', description: 'Track your orders' },
    { label: 'Wishlist', href: '/wishlist', description: 'Check your wishlist products' },
    { label: 'About Us', href: '/about', description: 'Learn more about SmartKenya' },
    { label: 'Careers', href: '/careers', description: 'Get your dream job at smartkenya' },
    { label: 'FAQs', href: '/faq', description: 'Get answers to most asked questions' },
    { label: 'Privacy Policy', href: '/privacy', description: 'Know your privacy at smartkenya' },
    { label: 'Returns', href: '/returns', description: 'Return policy' },
    { label: 'T&C', href: '/terms', description: 'Terms and Conditions of Smartkenya' },
  ];

  return (
    <>
      {/* Enhanced Schema for better sitelinks */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://www.smartkenya.co.ke",
          "name": "SmartKenya Online Shopping",
          "alternateName": "SmartKenya",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://www.smartkenya.co.ke/search?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          },
          "mainEntity": {
            "@type": "Organization",
            "name": "SmartKenya",
            "url": "https://www.smartkenya.co.ke"
          }
        })}
      </script>

      <header className={`bg-background border-b border-border/40 top-0 z-50 ${!isMobile ? '' : 'sticky'}`}>
        {/* Main navigation for desktop */}
        {!isMobile && (
          <nav 
            className={`py-2 bg-muted/30 border-b border-border/30 transition-all duration-300 ${showBottomNav ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`} 
            role="navigation" 
            aria-label="Main Navigation"
          >
            <div className="container mx-auto px-4 lg:px-8">
              <ul className="flex items-center justify-center gap-8">
                {mainNavItems.map(item => (
                  <li key={item.href}>
                    <Link 
                      to={item.href} 
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200" 
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

        <div className={`${isMobile ? 'py-3 px-4' : 'container mx-auto px-4 lg:px-8 py-4 transition-all duration-300'}`}>
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group">
              <img 
                src={smartkenyaLogo} 
                alt="SmartKenya Logo" 
                className={`object-contain transition-transform duration-200 group-hover:scale-105 ${!isMobile ? 'h-11 w-auto' : 'h-8 w-auto'}`} 
              />
            </Link>

            {/* Desktop Search - Expanded */}
            {!isMobile && !hideMainHeader && (
              <div className="flex-1 min-w-0">
                <EnhancedSearchInput 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  onSearch={handleSearch} 
                  placeholder="Search for products, brands, or categories..." 
                  className="w-full"
                />
              </div>
            )}

            {/* Desktop Actions */}
            {!isMobile && !hideMainHeader && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Wishlist */}
                <Link 
                  to="/wishlist" 
                  aria-label="View Wishlist" 
                  className="relative p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200"
                >
                  <Heart className="h-5 w-5" />
                </Link>

                {/* Cart */}
                <Link 
                  to="/cart" 
                  aria-label="View Cart" 
                  className="relative p-2.5 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50 transition-all duration-200"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-sm">
                      {totalItems > 99 ? '99+' : totalItems}
                    </span>
                  )}
                </Link>

                {/* User Account */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="gap-2 px-3 py-2 h-auto rounded-full hover:bg-muted/50"
                      >
                        <User className="h-5 w-5" />
                        <span className="text-sm font-medium hidden lg:inline">Account</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/50">
                      <div className="px-3 py-2.5 border-b border-border/50">
                        <p className="text-sm font-semibold text-foreground">
                          {profile?.first_name && profile?.last_name 
                            ? `${profile.first_name} ${profile.last_name}` 
                            : user.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                      <div className="py-1.5">
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer flex items-center gap-2.5 px-3 py-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/orders" className="cursor-pointer flex items-center gap-2.5 px-3 py-2">
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            <span>My Orders</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/wishlist" className="cursor-pointer flex items-center gap-2.5 px-3 py-2">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                            <span>Wishlist</span>
                          </Link>
                        </DropdownMenuItem>
                        {(isAdmin || isSuperAdmin || isModerator) && (
                          <DropdownMenuItem asChild>
                            <Link to="/supersmartkenyaadmin123" className="cursor-pointer flex items-center gap-2.5 px-3 py-2">
                              <Settings className="h-4 w-4 text-muted-foreground" />
                              <span>Admin Dashboard</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <button 
                          onClick={handleLogout} 
                          className="cursor-pointer flex items-center gap-2.5 px-3 py-2 w-full text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Log Out</span>
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    className="gap-2 px-4 rounded-full" 
                    onClick={() => navigate('/auth')}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Sign In</span>
                  </Button>
                )}
              </div>
            )}

            {/* Mobile Actions */}
            {isMobile && (
              <div className="flex items-center gap-1">
                <Link to="/search">
                  <Button variant="ghost" size="sm" className="p-2.5 rounded-full" aria-label="Search">
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
