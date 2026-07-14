import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  User, Bell, Globe, CreditCard, MapPin,
  ShoppingBag, Heart, Lock, Info,
  MessageCircleQuestion, RotateCcw, HelpCircle,
  Shield, Settings, LogOut, Palette,
} from 'lucide-react';
import { ChevronRight } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';

interface SettingsItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  description?: string;
  danger?: boolean;
  primary?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, isSuperAdmin, isModerator } = useUserRole(user?.id);
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const sections: SettingsSection[] = [
    {
      title: 'Account',
      items: [
        { icon: User,       label: 'Profile Information', description: 'Name, photo & details',         href: '/profile' },
        { icon: Lock,       label: 'Password & Security', description: 'Update your password',          href: '/security' },
        { icon: Bell,       label: 'Notifications',       description: 'Alerts & order updates',        href: '/notifications' },
        { icon: Globe,      label: 'Language & Region',   description: 'App language & currency',       href: '/language' },
        { icon: Palette,    label: 'Appearance',           description: 'Dark or light theme',           href: '/appearance' },
      ],
    },
    {
      title: 'Shopping',
      items: [
        { icon: ShoppingBag, label: 'Order History',  description: 'Track & manage your orders', href: '/orders' },
        { icon: MapPin,      label: 'My Addresses',   description: 'Saved delivery addresses',   href: '/addresses' },
        { icon: Heart,       label: 'Wishlist',        description: 'Items you\'ve saved',        href: '/wishlist' },
      ],
    },
    {
      title: 'Payments',
      items: [
        { icon: CreditCard, label: 'Billing & Payments', description: 'Payment methods & history', href: '/billing' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle,            label: 'Help & Support', description: 'Get help from our team', href: '/contact' },
        { icon: MessageCircleQuestion, label: 'FAQs',           description: 'Common questions',       href: '/faq' },
        { icon: RotateCcw,             label: 'Return Policy',  description: 'How returns work',       href: '/returns' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { icon: Shield, label: 'Privacy & Security', description: 'Data & privacy policy', href: '/privacy' },
        { icon: Info,   label: 'About Our Store',   description: 'App info & version',    href: '/about' },
      ],
    },
    ...(isAdmin || isSuperAdmin || isModerator
      ? [{
          title: 'Management',
          items: [
            {
              icon: Settings,
              label: 'Admin Dashboard',
              description: 'Manage products & users',
              href: '/admin',
              primary: true,
            },
          ],
        }]
      : []),
    {
      title: '',
      items: [
        { icon: LogOut, label: 'Sign Out', onClick: handleLogout, danger: true },
      ],
    },
  ];

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        {sections.map((section, si) =>
          section.items.length === 0 ? null : (
            <div key={si}>
              {section.title && (
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
                  {section.title}
                </p>
              )}
              <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
                {section.items.map((item, ii) => {
                  const { icon: Icon, label, description, href, onClick, danger, primary } = item;

                  const content = (
                    <div
                      className={`flex items-center gap-4 px-4 py-3.5 transition-colors
                        ${danger   ? 'hover:bg-destructive/5'  : ''}
                        ${primary  ? 'hover:bg-primary/5'      : ''}
                        ${!danger && !primary ? 'hover:bg-muted/50' : ''}
                        ${ii !== section.items.length - 1 ? 'border-b border-border' : ''}
                      `}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                        ${danger  ? 'bg-destructive/10' : ''}
                        ${primary ? 'bg-primary/10'     : ''}
                        ${!danger && !primary ? 'bg-muted' : ''}
                      `}>
                        <Icon className={`w-[18px] h-[18px]
                          ${danger  ? 'text-destructive'   : ''}
                          ${primary ? 'text-primary'       : ''}
                          ${!danger && !primary ? 'text-muted-foreground' : ''}
                        `} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-[14px] font-medium
                          ${danger  ? 'text-destructive' : ''}
                          ${primary ? 'text-primary'     : ''}
                          ${!danger && !primary ? 'text-foreground' : ''}
                        `}>
                          {label}
                        </p>
                        {description && (
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{description}</p>
                        )}
                      </div>

                      {!danger && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </div>
                  );

                  return onClick ? (
                    <button key={label} onClick={onClick} className="w-full text-left">
                      {content}
                    </button>
                  ) : (
                    <Link key={href} to={href!}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          )
        )}
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-8">Store v1.0.0</p>
    </div>
  );
};

export default SettingsPage;