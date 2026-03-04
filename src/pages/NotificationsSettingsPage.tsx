import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';
import { isMobileUserAgent } from '@/hooks/use-mobile';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const NotificationsSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();
  const { preferences, updatePreferences } = useUserPreferences();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  const toggleNotification = (key: 'email' | 'push' | 'sms') => {
    updatePreferences({
      notifications: { ...preferences.notifications, [key]: !preferences.notifications[key] }
    });
  };

  const items = [
    { key: 'email' as const, icon: Mail, label: 'Email Notifications', desc: 'Order updates & promotions' },
    { key: 'push' as const, icon: Smartphone, label: 'Push Notifications', desc: 'Real-time alerts on your device' },
    { key: 'sms' as const, icon: MessageSquare, label: 'SMS Notifications', desc: 'Text message alerts' },
  ];

  return (
    <div className={`min-h-screen bg-muted/50 pb-10 ${!isMobile ? 'max-w-[480px] mx-auto' : ''}`}>
      <div className="px-4 pt-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-1 mb-2">
          Notification Preferences
        </p>
        <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
          {items.map(({ key, icon: Icon, label, desc }, i) => (
            <button
              key={key}
              onClick={() => toggleNotification(key)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/50 transition-colors ${i !== items.length - 1 ? 'border-b border-border' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <Icon className="w-[18px] h-[18px] text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[14px] font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${preferences.notifications[key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <div className={`w-5 h-5 rounded-full bg-background shadow-sm transition-transform ${preferences.notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettingsPage;
