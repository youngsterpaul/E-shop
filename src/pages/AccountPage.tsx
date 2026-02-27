import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import {
  User, ShoppingBag, Heart, PackageX,
  Gift, Award, Flame, Truck,
  Star, RotateCcw, ShoppingCart, Package,
  MapPin, HeadphonesIcon, ChevronRight,
  TrendingUp, Zap,
} from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';

const AccountPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const firstName = profile?.first_name || 'Shopper';
  const initials = firstName[0].toUpperCase();

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' :
    greetingHour < 17 ? 'Good afternoon' :
    'Good evening';

  return (
    <div className={`min-h-screen bg-[#F4F5F7] pb-28 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>

      {/* ════════════════════════════════════════
          HERO — split diagonal card
      ════════════════════════════════════════ */}
      <div className="relative bg-primary overflow-hidden" style={{ minHeight: 210 }}>

        {/* Large faint ring top-right */}
        <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full border-[32px] border-white/10 pointer-events-none" />
        {/* Small ring bottom-left */}
        <div className="absolute bottom-4 -left-6 w-28 h-28 rounded-full border-[16px] border-white/10 pointer-events-none" />
        {/* Tiny dot accent */}
        <div className="absolute top-14 right-20 w-3 h-3 rounded-full bg-white/30 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 px-5 pt-8 pb-14">
          <p className="text-white/70 text-[13px] font-medium">{greeting},</p>
          <h1 className="text-white text-[26px] font-bold tracking-tight leading-none mt-0.5">
            {firstName} 👋
          </h1>
          <p className="text-white/60 text-[12px] mt-1.5 truncate">{user.email}</p>
        </div>

        {/* Diagonal white cut at the bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-10 bg-[#F4F5F7]"
          style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}
        />
      </div>

      {/* ════════════════════════════════════════
          FLOATING PROFILE CARD
          (overlaps the hero bottom cut)
      ════════════════════════════════════════ */}
      <div className="px-4 -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-md px-4 py-4 flex items-center gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-xl font-bold">{initials}</span>
              )}
            </div>
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-gray-900 truncate">
              {profile?.first_name} {profile?.last_name ?? ''}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                <Flame className="w-3 h-3" /> Silver Member
              </span>
            </div>
          </div>

          <Link to="/profile">
            <div className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </div>
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════
          STATS ROW — 3 quick-impact numbers
      ════════════════════════════════════════ */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2.5">
        {[
          { label: 'Points',   value: '0',    accent: 'bg-amber-50  text-amber-500',  href: '/loyalty' },
          { label: 'Vouchers', value: '0',    accent: 'bg-blue-50   text-blue-500',   href: '/rewards' },
          { label: 'Badges',   value: '0',    accent: 'bg-purple-50 text-purple-500', href: '/achievements' },
        ].map(({ label, value, accent, href }) => (
          <Link key={href} to={href}>
            <div className="bg-white rounded-2xl p-3.5 shadow-sm text-center hover:shadow-md transition-shadow">
              <p className={`text-[22px] font-black ${accent.split(' ')[1]}`}>{value}</p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ════════════════════════════════════════
          MY ORDERS — horizontal scroll pill tabs
          + icon grid below
      ════════════════════════════════════════ */}
      <div className="mt-4 px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="text-[14px] font-bold text-gray-800">My Orders</h3>
            </div>
            <Link to="/orders" className="text-[12px] text-primary font-semibold hover:underline">
              View All →
            </Link>
          </div>

          {/* Order status icons */}
          <div className="grid grid-cols-5 py-4 px-2">
            {[
              { icon: ShoppingCart, label: 'Unpaid',     href: '/orders?status=unpaid',    badge: null },
              { icon: Package,      label: 'Processing', href: '/orders?status=processing', badge: null },
              { icon: Truck,        label: 'Shipped',    href: '/orders?status=shipped',    badge: null },
              { icon: Star,         label: 'Review',     href: '/orders?status=review',     badge: 1    },
              { icon: RotateCcw,    label: 'Returns',    href: '/my-returns',               badge: null },
            ].map(({ icon: Icon, label, href, badge }) => (
              <Link key={href} to={href}>
                <div className="flex flex-col items-center gap-1.5 hover:opacity-75 transition-opacity">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    {badge && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          QUICK ACCESS — 2-column featured cards
      ════════════════════════════════════════ */}
      <div className="mt-3 px-4">
        <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-0.5">Quick Access</h3>
        <div className="grid grid-cols-2 gap-2.5">

          {/* Wishlist — tall accent card */}
          <Link to="/wishlist">
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-rose-100/60 pointer-events-none" />
              <Heart className="w-6 h-6 text-rose-500" />
              <div>
                <p className="text-[14px] font-bold text-rose-600">Wishlist</p>
                <p className="text-[11px] text-rose-400">Saved items</p>
              </div>
            </div>
          </Link>

          {/* Returns */}
          <Link to="/my-returns">
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-orange-100/60 pointer-events-none" />
              <PackageX className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-[14px] font-bold text-orange-600">My Returns</p>
                <p className="text-[11px] text-orange-400">Track requests</p>
              </div>
            </div>
          </Link>

          {/* Rewards */}
          <Link to="/rewards">
            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-purple-100/60 pointer-events-none" />
              <Gift className="w-6 h-6 text-purple-500" />
              <div>
                <p className="text-[14px] font-bold text-purple-600">Rewards</p>
                <p className="text-[11px] text-purple-400">Claim yours</p>
              </div>
            </div>
          </Link>

          {/* Achievements */}
          <Link to="/achievements">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 h-28 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-green-100/60 pointer-events-none" />
              <Award className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-[14px] font-bold text-green-600">Achievements</p>
                <p className="text-[11px] text-green-400">Your badges</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SERVICES — horizontal chip row
      ════════════════════════════════════════ */}
      <div className="mt-3 px-4">
        <div className="bg-white rounded-2xl shadow-sm px-4 py-4">
          <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-3">Services</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {[
              { icon: MapPin,           label: 'Address',       href: '/profile',  color: 'text-blue-500   bg-blue-50'   },
              { icon: HeadphonesIcon,   label: 'Support',       href: '/contact',  color: 'text-teal-500   bg-teal-50'   },
              { icon: TrendingUp,       label: 'Loyalty',       href: '/loyalty',  color: 'text-amber-500  bg-amber-50'  },
              { icon: Zap,              label: 'Flash Deals',   href: '/flash-sale',    color: 'text-red-500    bg-red-50'    },
            ].map(({ icon: Icon, label, href, color }) => {
              const [text, bg] = color.split(' ');
              return (
                <Link key={href} to={href} className="flex-shrink-0">
                  <div className="flex flex-col items-center gap-2 w-16 hover:opacity-75 transition-opacity">
                    <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${text}`} />
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium text-center leading-tight">{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          PROMO BANNER — editorial strip
      ════════════════════════════════════════ */}
      <div className="mt-3 mx-4">
        <div className="bg-primary rounded-2xl px-5 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-white/80 text-[11px] font-medium">Loyalty Program</p>
            <p className="text-white text-[16px] font-bold mt-0.5 leading-tight">Earn points on<br/>every purchase</p>
            <Link to="/loyalty">
              <span className="inline-block mt-2.5 bg-white text-primary text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                Learn more
              </span>
            </Link>
          </div>
          <Flame className="w-16 h-16 text-white/20 absolute right-4 bottom-2" />
        </div>
      </div>

    </div>
  );
};

export default AccountPage;