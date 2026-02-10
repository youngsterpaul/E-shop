import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  User, ShoppingBag, Heart, Shield, HelpCircle, Info, 
  LucideMessageCircleQuestion, CarTaxiFront, GraduationCap, 
  PackageX, Settings, ChevronRight, LogOut, Award, Gift, Flame
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
    if (!user) navigate('/auth');
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  // 1. ORGANIZED STRUCTURE
  const menuSections = [
    {
      title: "Personal & Orders",
      items: [
        { icon: User, title: 'Profile Information', description: 'Update your details', href: '/profile' },
        { icon: ShoppingBag, title: 'My Orders', description: 'Track your orders', href: '/orders' },
        { icon: Heart, title: 'Wishlist', description: 'Your saved items', href: '/wishlist' },
        { icon: PackageX, title: 'My Returns', description: 'Track return requests', href: '/my-returns' },
      ]
    },
    {
      title: "Rewards & Achievements",
      items: [
        { icon: Gift, title: 'Loyalty Points', description: 'Earn & redeem points', href: '/loyalty' },
        { icon: Award, title: 'Achievements', description: 'Your badges & tier', href: '/achievements' },
        { icon: Flame, title: 'Rewards', description: 'Available rewards', href: '/rewards' },
      ]
    },
    {
      title: "Support & Info",
      items: [
        { icon: Info, title: 'About SmartKenya', description: 'Know more about us', href: '/about' },
        { icon: LucideMessageCircleQuestion, title: 'FAQs', description: 'Common questions', href: '/faq' },
        { icon: CarTaxiFront, title: 'Return Policy', description: 'Our return rules', href: '/returns' },
        { icon: HelpCircle, title: 'Help & Support', description: 'Contact support', href: '/contact' },
      ]
    },
    {
      title: "Legal & Careers",
      items: [
        { icon: GraduationCap, title: 'Careers', description: 'Join our team', href: '/careers' },
        { icon: Shield, title: 'Privacy & Security', description: 'Your data safety', href: '/privacy' },
      ]
    }
  ];

  return (
    <div className={`min-h-screen bg-background ${!isMobile ? 'min-w-max' : ''}`}>
      <main className={`${!isMobile ? 'max-w-[1200px] mx-auto px-4 lg:px-6 py-6' : 'px-3 py-4 pb-24'}`}>
        
        {/* Header */}
        {!isMobile && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Account</h1>
          </div>
        )}

        {/* User Identity Card */}
        <Card className="mb-8 border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                {profile?.avatar_url ? (
                  <img src={profile?.avatar_url} alt="Profile" className="h-14 w-14 object-cover rounded-full" />
                ) : (
                  <User className="h-7 w-7 text-primary" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-foreground">{profile?.first_name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {/* Added Logout Button for better UX */}
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        {/* 2. RENDER SECTIONS */}
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 px-1">
              {section.title}
            </h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
              {section.items.map((item) => (
                <Link key={item.href} to={item.href}>
                  <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10">
                        <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Admin Section */}
        {(isAdmin || isSuperAdmin || isModerator) && (
          <div className="mt-10">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 px-1">Management</h3>
            <Link to="/supersmartkenyaadmin123">
              <Card className="border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-primary">Admin Dashboard</h4>
                    <p className="text-xs text-primary/70">Manage site products and users</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary/50" />
                </CardContent>
              </Card>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default AccountPage;