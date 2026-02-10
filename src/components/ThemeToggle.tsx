import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export const ThemeToggle = ({ variant = 'icon' }: { variant?: 'icon' | 'card' }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Sync Android StatusBar with theme
  useEffect(() => {
    if (!mounted || !Capacitor.isNativePlatform()) return;
    const isDark = resolvedTheme === 'dark';
    StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    StatusBar.setBackgroundColor({ color: isDark ? '#0f172a' : '#16a34a' });
  }, [resolvedTheme, mounted]);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  if (variant === 'card') {
    return (
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all group"
      >
        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center group-hover:bg-primary/10">
          {isDark ? (
            <Sun className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          )}
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</h4>
          <p className="text-xs text-muted-foreground">
            {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          </p>
        </div>
        <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${isDark ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
          <div className={`w-5 h-5 rounded-full bg-background shadow-sm transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted/50"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
};
