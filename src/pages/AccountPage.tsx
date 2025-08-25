
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { MobileHeader } from '@/components/ui/mobile-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  ShoppingBag, 
  MapPin, 
  Settings, 
  LogOut,
  Heart,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
  FileQuestion,
  Info,
  LucideMessageCircleQuestion,
  CarTaxiFront,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import MobileNav from '@/components/MobileNav';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  const accountMenuItems = [
    {
      icon: User,
      title: 'Profile Information',
      description: 'Update your personal details',
      href: '/profile',
    },
    {
      icon: ShoppingBag,
      title: 'My Orders',
      description: 'Track and manage your orders',
      href: '/orders',
    },
    {
      icon: Heart,
      title: 'Wishlist',
      description: 'Your saved items',
      href: '/wishlist',
    },
    {
      icon: Info,
      title: 'About SmartKenya',
      description: 'Know more about SmartKenya',
      href: '/about',
    },
    {
      icon: LucideMessageCircleQuestion,
      title: 'FAQs',
      description: 'Get answers to common questions',
      href: '/faq',
    },
    {
      icon: CarTaxiFront,
      title: 'Returns & Refunds',
      description: 'Know our return policy',
      href: '/returns',
    },
    {
      icon: GraduationCap,
      title: 'Careers',
      description: 'Explore Careers at SmartKenya',
      href: '/careers',
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Know how we protect your data',
      href: '/privacy',
    },
    {
      icon: HelpCircle,
      title: 'Help & Support',
      description: 'Get help and contact support',
      href: '/contact',
    },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${!isMobile ? 'min-w-max' : ''}`}>
      {!isMobile && <Header />}
      {isMobile && (
        <MobileHeader 
        title="My Account"
        backTo="/"
        rightAction={
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sign Out
                </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
        }
      />
      )}

      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'pb-14' : ''}`}>
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
        )}

        {/* User Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Welcome!'
                  }
                </h2>
                <p className="text-gray-600">{user.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-gray-500">{profile.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {accountMenuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin Panel Link */}
        {profile?.is_admin && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <Link to="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-orange-800">Admin Dashboard</h3>
                  <p className="text-sm text-orange-600">Manage products, orders, and users</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
      <MobileNav />
    </div>
  );
};

export default AccountPage;
