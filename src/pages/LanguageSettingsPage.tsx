import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const LanguageSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { preferences, updatePreferences } = useUserPreferences();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const languages = [
    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
    { code: 'sw' as const, label: 'Kiswahili', flag: '🇰🇪' },
  ];

  const currencies = [
    { code: 'KES' as const, label: 'Kenyan Shilling (KES)', symbol: 'KSh' },
    { code: 'USD' as const, label: 'US Dollar (USD)', symbol: '$' },
  ];

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">Language</p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {languages.map(({ code, label, flag }, i) => (
            <button
              key={code}
              onClick={() => updatePreferences({ language: code })}
              className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== languages.length - 1 ? 'border-b border-border' : ''}`}
            >
              <span className="text-2xl">{flag}</span>
              <p className="flex-1 text-left text-[14px] font-medium text-foreground">{label}</p>
              {preferences.language === code && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2 mt-4">Currency</p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {currencies.map(({ code, label, symbol }, i) => (
            <button
              key={code}
              onClick={() => updatePreferences({ currency: code })}
              className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== currencies.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-muted-foreground">{symbol}</span>
              </div>
              <p className="flex-1 text-left text-[14px] font-medium text-foreground">{label}</p>
              {preferences.currency === code && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSettingsPage;
