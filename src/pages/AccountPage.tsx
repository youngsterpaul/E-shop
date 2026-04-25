import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  User, ShoppingBag, Heart, PackageX,
  Gift, Award, Flame, Truck,
  Star, RotateCcw, ShoppingCart, Package,
  MapPin, HeadphonesIcon, ChevronRight,
  TrendingUp, Zap, Loader2,
} from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useLoyaltyPoints } from '@/hooks/useLoyaltyPoints';
import { useGamification } from '@/hooks/useGamification';
import { useWishlist } from '@/hooks/useWishlist';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AccountPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { points, isLoading: pointsLoading } = useLoyaltyPoints();
  const { achievements, userTier, getAchievementStatus, streak } = useGamification();
  const { wishlistItems } = useWishlist();

  // Fetch order counts by status
  const { data: orderCounts } = useQuery({
    queryKey: ['order-counts', user?.id],
    queryFn: async () => {
      if (!user) return { unpaid: 0, processing: 0, shipped: 0, review: 0, returns: 0 };
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('user_id', user.id);
      if (error) throw error;
      return {
        unpaid: data.filter(o => o.status === 'pending').length,
        processing: data.filter(o => o.status === 'processing' || o.status === 'packed').length,
        shipped: data.filter(o => o.status === 'shipped').length,
        review: data.filter(o => o.status === 'delivered').length,
        returns: 0,
      };
    },
    enabled: !!user,
  });

  // Fetch voucher/redemption count
  const { data: voucherCount } = useQuery({
    queryKey: ['voucher-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('reward_redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const firstName = profile?.first_name || 'Shopper';
  const initials = firstName[0].toUpperCase();
  const achievementStatus = getAchievementStatus();
  const tierName = userTier?.tier?.tier_name || 'Bronze';
  const tierColor = userTier?.tier?.badge_color || '#cd7f32';

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' :
    'Good evening';

  return (
    <div className={`min-h-screen bg-muted/50 pb-28 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>

      {/* HERO */}
      <div className="relative bg-primary overflow-hidden" style={{ minHeight: 210 }}>
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full border-[32px] border-white/10 pointer-events-none" />
        <div className="absolute bottom-4 -left-6 w-28 h-28 rounded-full border-[16px] border-white/10 pointer-events-none" />
        <div className="absolute top-14 right-20 w-3 h-3 rounded-full bg-white/30 pointer-events-none" />

        <div className="relative z-10 px-5 pt-8 pb-14">
          <p className="text-white/70 text-[13px] font-medium">{greeting},</p>
          <h1 className="text-white text-[26px] font-bold tracking-tight leading-none mt-0.5">
            {firstName} 👋
          </h1>
          <p className="text-white/60 text-[12px] mt-1.5 truncate">{user.email}</p>
        </div>

        <div
          className="absolute bottom-0 left-0 w-full h-10 bg-muted/50"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </div>

      {/* FLOATING PROFILE CARD */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="bg-card rounded-2xl shadow-md px-4 py-4 flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-xl font-bold">{initials}</span>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-card" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-foreground truncate">
              {profile?.first_name} {profile?.last_name ?? ''}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${tierColor}15`,
                  color: tierColor,
                  borderColor: `${tierColor}40`,
                }}
              >
                <Flame className="w-3 h-3" /> {tierName} Member
              </span>
              {streak && streak.current_streak > 0 && (
                <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-700">
                  🔥 {streak.current_streak}d
                </span>
              )}
            </div>
          </div>

          <Link to="/profile">
            <div className="w-9 h-9 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      </div>

      {/* STATS ROW */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Points', value: pointsLoading ? '...' : String(points?.points ?? 0), accent: 'text-amber-500', href: '/loyalty' },
          { label: 'Vouchers', value: String(voucherCount ?? 0), accent: 'text-blue-500', href: '/rewards' },
          { label: 'Badges', value: String(achievementStatus.unlocked), accent: 'text-purple-500', href: '/achievements' },
        ].map(({ label, value, accent, href }) => (
          <Link key={href} to={href}>
            <div className="bg-card rounded-2xl p-3.5 shadow-sm text-center hover:shadow-md transition-shadow">
              <p className={`text-[22px] font-black ${accent}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* MY ORDERS */}
      <div className="mt-4 px-4">
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-[14px] font-bold text-foreground">My Orders</h3>
            </div>
            <Link to="/orders" className="text-[12px] text-primary font-semibold hover:underline">
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-5 py-4 px-2">
            {[
              { icon: ShoppingCart, label: 'Unpaid', href: '/orders?status=pending', badge: orderCounts?.unpaid || null },
              { icon: Package, label: 'Processing', href: '/orders?status=processing', badge: orderCounts?.processing || null },
              { icon: Truck, label: 'Shipped', href: '/orders?status=shipped', badge: orderCounts?.shipped || null },
              { icon: Star, label: 'Review', href: '/reviews', badge: orderCounts?.review || null },
              { icon: RotateCcw, label: 'Returns', href: '/my-returns', badge: null },
            ].map(({ icon: Icon, label, href, badge }) => (
              <Link key={href} to={href}>
                <div className="flex flex-col items-center gap-1.5 hover:opacity-75 transition-opacity">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center border border-border">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    {badge !== null && badge > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div className="mt-3 px-4">
        <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-0.5">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Link to="/wishlist">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-rose-100/60 dark:bg-rose-800/30 pointer-events-none" />
              <Heart className="w-6 h-6 text-rose-500" />
              <div>
                <p className="text-[14px] font-bold text-rose-600 dark:text-rose-400">Wishlist</p>
                <p className="text-[11px] text-rose-400 dark:text-rose-500">{wishlistItems?.length || 0} items</p>
              </div>
            </div>
          </Link>

          <Link to="/my-returns">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-orange-100/60 dark:bg-orange-800/30 pointer-events-none" />
              <PackageX className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-[14px] font-bold text-orange-600 dark:text-orange-400">My Returns</p>
                <p className="text-[11px] text-orange-400 dark:text-orange-500">Track requests</p>
              </div>
            </div>
          </Link>

          <Link to="/rewards">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-purple-100/60 dark:bg-purple-800/30 pointer-events-none" />
              <Gift className="w-6 h-6 text-purple-500" />
              <div>
                <p className="text-[14px] font-bold text-purple-600 dark:text-purple-400">Rewards</p>
                <p className="text-[11px] text-purple-400 dark:text-purple-500">{voucherCount ?? 0} vouchers</p>
              </div>
            </div>
          </Link>

          <Link to="/achievements">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-green-100/60 dark:bg-green-800/30 pointer-events-none" />
              <Award className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-[14px] font-bold text-green-600 dark:text-green-400">Achievements</p>
                <p className="text-[11px] text-green-400 dark:text-green-500">{achievementStatus.unlocked}/{achievementStatus.total} badges</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SERVICES */}
      <div className="mt-3 px-4">
        <div className="bg-card rounded-2xl shadow-sm px-4 py-4">
          <h3 className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Services</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {[
              { icon: MapPin, label: 'Address', href: '/profile', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
              { icon: HeadphonesIcon, label: 'Support', href: '/contact', color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/30' },
              { icon: TrendingUp, label: 'Loyalty', href: '/loyalty', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
              { icon: Zap, label: 'Flash Deals', href: '/flash-sale', color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
            ].map(({ icon: Icon, label, href, color }) => {
              const parts = color.split(' ');
              const text = parts[0];
              const bg = parts.slice(1).join(' ');
              return (
                <Link key={href} to={href} className="flex-shrink-0">
                  <div className="flex flex-col items-center gap-2 w-16 hover:opacity-75 transition-opacity">
                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${text}`} />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-medium text-center leading-tight">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* PROMO BANNER */}
      <div className="mt-3 mx-4">
        <div className="bg-primary rounded-2xl px-5 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-primary-foreground/80 text-[11px] font-medium">Loyalty Program</p>
            <p className="text-primary-foreground text-[16px] font-bold mt-0.5 leading-tight">Earn points on<br/>every purchase</p>
            <Link to="/loyalty">
              <span className="inline-block mt-2.5 bg-background text-primary text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-background/90 transition-colors">
                Learn more
              </span>
            </Link>
          </div>
          <Flame className="w-16 h-16 text-primary-foreground/20 absolute right-4 bottom-2" />
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
