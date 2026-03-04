import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const AppearanceSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  useEffect(() => {
    if (!mounted || !Capacitor.isNativePlatform()) return;
    const isDark = resolvedTheme === 'dark';
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    StatusBar.setBackgroundColor({ color: isDark ? '#0f172a' : '#16a34a' });
  }, [resolvedTheme, mounted]);

  if (!user || !mounted) return null;

  const options = [
    { value: 'light', label: 'Light', desc: 'Classic bright theme', icon: Sun },
    { value: 'dark', label: 'Dark', desc: 'Easy on the eyes', icon: Moon },
    { value: 'system', label: 'System', desc: 'Match device settings', icon: Monitor },
  ];

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
          Theme
        </p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {options.map(({ value, label, desc, icon: Icon }, i) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== options.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${theme === value ? 'bg-primary/10' : 'bg-muted'}`}>
                <Icon className={`w-[18px] h-[18px] ${theme === value ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-[14px] font-medium ${theme === value ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${theme === value ? 'border-primary' : 'border-muted-foreground/30'}`}>
                {theme === value && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettingsPage;
