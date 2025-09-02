import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Show offline indicator if already offline
    if (!navigator.onLine) {
      setShowOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide online indicator after 3 seconds
  useEffect(() => {
    if (isOnline && !showOffline) {
      const timer = setTimeout(() => {
        setShowOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOffline]);

  if (!showOffline && isOnline) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <Card className={`border-border shadow-lg ${
        isOnline 
          ? 'bg-success/90 text-success-foreground' 
          : 'bg-destructive/90 text-destructive-foreground'
      }`}>
        <CardContent className="px-4 py-2">
          <div className="flex items-center gap-2 text-sm">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Back online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>You're offline</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};