
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, 
  ShoppingBag, 
  Heart,
  Shield,
  HelpCircle,
  Info,
  LucideMessageCircleQuestion,
  CarTaxiFront,
  GraduationCap,
  PackageX,
  Settings,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';

const AccountPage = () => {
  const { user, profile, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, isModerator } = useUserRole(user?.id);
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
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1400px] mx-auto px-4 lg:px-6 py-6' : 'px-3 py-4 pb-24'}`}>
        {!isMobile && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Account</h1>
            <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
          </div>
        )}

        {/* User Info Card */}
        <Card className={`${isMobile ? 'mb-4' : 'mb-6'} border-border/50 shadow-sm`}>
          <CardContent className={isMobile ? 'p-3' : 'p-4'}>
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20`}>
                {profile?.avatar_url ? (
                  <img 
                    src={profile?.avatar_url} 
                    alt={profile?.first_name || ''} 
                    className={`${isMobile ? 'h-12 w-12' : 'h-14 w-14'} object-cover rounded-full`}
                  />
                ) : (
                  <User className={`${isMobile ? 'h-6 w-6' : 'h-7 w-7'} text-primary`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground truncate`}>
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Welcome!'
                  }
                </h2>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>{user.email}</p>
                {profile?.phone && (
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground/80`}>{profile.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Menu */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isMobile ? 'gap-2 mb-4' : 'gap-3 mb-6'}`}>
          {accountMenuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className={isMobile ? 'p-3' : 'p-4'}>
                  <div className="flex items-center gap-3">
                    <div className={`${isMobile ? 'w-9 h-9' : 'w-11 h-11'} bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors`}>
                      <item.icon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground group-hover:text-primary transition-colors`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`${isMobile ? 'text-sm' : ''} font-medium text-foreground truncate`}>{item.title}</h3>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground truncate`}>{item.description}</p>
                    </div>
                    <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0`} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin Panel Link */}
        {(isAdmin || isSuperAdmin || isModerator) && (
          <Card className={`${isMobile ? 'mb-4' : 'mb-6'} border-primary/30 bg-primary/5`}>
            <CardContent className={isMobile ? 'p-3' : 'p-4'}>
              <Link to="/supersmartkenyaadmin123" className="flex items-center gap-3">
                <div className={`${isMobile ? 'w-9 h-9' : 'w-11 h-11'} bg-primary/20 rounded-xl flex items-center justify-center`}>
                  <Settings className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`${isMobile ? 'text-sm' : ''} font-medium text-primary`}>Admin Dashboard</h3>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-primary/70`}>Manage products, orders, and users</p>
                </div>
                <ChevronRight className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-primary/50 flex-shrink-0`} />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className={`w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive ${isMobile ? 'h-10 text-sm' : ''}`}
        >
          <LogOut className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} mr-2`} />
          Sign Out
        </Button>
      </main>
    </div>
  );
};

export default AccountPage;
