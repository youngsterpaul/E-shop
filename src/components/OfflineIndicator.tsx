<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setVisible(true);
      // Hide after 3 seconds
      setTimeout(() => setVisible(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!visible) return null;

  const statusStyles = isOnline
    ? 'bg-success/90 text-success-foreground'
    : 'bg-destructive/90 text-destructive-foreground';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <Card className={`border-border shadow-lg ${statusStyles}`}>
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
                <span>You’re offline</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
=======
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setVisible(true);
      // Hide after 3 seconds
      setTimeout(() => setVisible(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!visible) return null;

  const statusStyles = isOnline
    ? 'bg-success/90 text-success-foreground'
    : 'bg-destructive/90 text-destructive-foreground';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <Card className={`border-border shadow-lg ${statusStyles}`}>
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
                <span>You’re offline</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
