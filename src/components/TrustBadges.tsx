import { Shield, Truck, RefreshCcw, CreditCard, Headphones, Award } from 'lucide-react';

interface TrustBadgesProps {
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const badges = [
  {
    icon: Shield,
    title: 'Secure Shopping',
    description: '256-bit SSL encryption',
    shortTitle: 'Secure',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Nationwide shipping',
    shortTitle: 'Fast Shipping',
  },
  {
    icon: RefreshCcw,
    title: 'Easy Returns',
    description: '7-day return policy',
    shortTitle: 'Easy Returns',
  },
  {
    icon: CreditCard,
    title: 'Safe Payments',
    description: 'M-Pesa & Cards accepted',
    shortTitle: 'Safe Pay',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Always here to help',
    shortTitle: 'Support',
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description: 'Genuine products only',
    shortTitle: 'Quality',
  },
];

export const TrustBadges = ({ variant = 'default', className = '' }: TrustBadgesProps) => {
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-4 py-4 ${className}`}>
        {badges.slice(0, 4).map((badge, index) => (
          <div key={index} className="flex items-center gap-2 text-muted-foreground">
            <badge.icon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">{badge.shortTitle}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 ${className}`}>
        <h3 className="text-lg font-bold text-foreground mb-4 text-center">Why Shop With Us</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                <badge.icon className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-foreground mb-1">{badge.title}</h4>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`bg-muted/30 border-y border-border/50 py-4 md:py-6 ${className}`}>
      <div className="container mx-auto px-3 md:px-4">
        <div className="grid grid-cols-6 gap-2 md:gap-4 lg:gap-6">
          {badges.slice(0, 6).map((badge, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-lg md:rounded-xl flex items-center justify-center mb-1 md:mb-2 group-hover:bg-primary/20 transition-colors">
                <badge.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <h4 className="text-[10px] md:text-xs font-medium md:font-semibold text-foreground leading-tight">{badge.shortTitle}</h4>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;
