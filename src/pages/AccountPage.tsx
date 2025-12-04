
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
    <div className="min-h-screen bg-background">
      <main className={`container mx-auto px-4 lg:px-8 py-6 ${isMobile ? 'pb-24' : ''}`}>
        {!isMobile && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Account</h1>
            <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
          </div>
        )}

        {/* User Info Card */}
        <Card className="mb-6 border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                {profile?.avatar_url ? (
                  <img 
                    src={profile?.avatar_url} 
                    alt={profile?.first_name || ''} 
                    className="h-14 w-14 object-cover rounded-full"
                  />
                ) : (
                  <User className="h-7 w-7 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Welcome!'
                  }
                </h2>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                {profile?.phone && (
                  <p className="text-sm text-muted-foreground/80">{profile.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {accountMenuItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Admin Panel Link */}
        {(isAdmin || isSuperAdmin || isModerator) && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <Link to="/supersmartkenyaadmin123" className="flex items-center gap-4">
                <div className="w-11 h-11 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-primary">Admin Dashboard</h3>
                  <p className="text-sm text-primary/70">Manage products, orders, and users</p>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/50" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Logout Button */}
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </main>
    </div>
  );
};

export default AccountPage;
