
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
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
  GraduationCap,
  Truck,
  PackageX
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useUserRole } from '@/hooks/useUserRole';

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, isModerator, hasAnyAdminRole } = useUserRole(user?.id);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
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
      icon: PackageX,
      title: 'My Returns',
      description: 'Track your return requests',
      href: '/my-returns',
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
      title: 'Return Policy',
      description: 'Learn about our return policy',
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
      <div className={`container mx-auto py-2 ${isMobile ? 'pb-8 px-2' : 'px-4 xl:px-24'}`}>
        {!isMobile && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Account</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </div>
        )}

        {/* User Info Card */}
        <Card className="mb-2">
          <CardContent className="p-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img 
                    src={profile?.avatar_url} 
                    alt={profile?.first_name || ''} 
                    className="h-12 w-12 object-cover rounded-full"
                  />
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Welcome!'
                  }
                </h2>
                <p className="text-gray-600 text-xs">{user.email}</p>
                {profile?.phone && (
                  <p className="text-xs text-gray-500">{profile.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          {accountMenuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin Panel Link */}
        {(isAdmin || isSuperAdmin || isModerator) && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-2">
              <Link to="/supersmartkenyaadmin123" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sm text-orange-800">Admin Dashboard</h3>
                  <p className="text-xs text-orange-600">Manage products, orders, and users</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
