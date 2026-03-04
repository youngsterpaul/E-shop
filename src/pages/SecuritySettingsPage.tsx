import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Lock, Shield, Smartphone, ChevronRight } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const SecuritySettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const items = [
    { icon: Lock, label: 'Change Password', desc: 'Update your account password', href: '/auth?mode=reset' },
    { icon: Smartphone, label: 'Two-Factor Authentication', desc: 'Add extra security to your account', href: '/mfa-setup' },
    { icon: Shield, label: 'Privacy Policy', desc: 'View our data practices', href: '/privacy' },
  ];

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
          Password & Security
        </p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {items.map(({ icon: Icon, label, desc, href }, i) => (
            <Link key={href} to={href}>
              <div className={`flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== items.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-[18px] h-[18px] text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecuritySettingsPage;
