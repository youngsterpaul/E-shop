import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useVersionCheck } from '@/hooks/useVersionCheck';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Paths where we should delay updates (user is actively working)
const SENSITIVE_PATHS = ['/checkout', '/cart', '/auth', '/product/'];

export const VersionManager = () => {
  const location = useLocation();
  const [pendingUpdate, setPendingUpdate] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(5);
  const [isInSensitivePath, setIsInSensitivePath] = useState(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout>();
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const handleUpdateAvailable = useCallback(() => {
    // Check if user is in a sensitive path
    const isSensitive = SENSITIVE_PATHS.some(path => 
      location.pathname.startsWith(path)
    );
    
    setIsInSensitivePath(isSensitive);

    if (isSensitive) {
      // Show notification but don't auto-update
      toast({
        title: "Update Available",
        description: "A new version is ready. The app will update when you navigate away from this page.",
        duration: 8000,
        action: (
          <Button
            size="sm"
            onClick={handleUpdateNow}
            className="bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Update Now
          </Button>
        ),
      });
      setPendingUpdate(true);
    } else {
      // Auto-update with countdown
      startUpdateCountdown();
    }
  }, [location.pathname]);

  const { newVersionAvailable } = useVersionCheck({
    checkInterval: 5 * 60 * 1000, // Check every 5 minutes (reduced frequency)
    onUpdateAvailable: handleUpdateAvailable,
    enabled: true
  });

  const clearAllCaches = async () => {
    try {
      // Clear localStorage app version marker
      localStorage.removeItem('app_version');
      
      // Clear service worker caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[VersionManager] All caches cleared');
      }

      // Clear session storage except for form data backups
      const formData: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('form_backup_')) {
          formData[key] = sessionStorage.getItem(key) || '';
        }
      }
      sessionStorage.clear();
      Object.entries(formData).forEach(([key, value]) => {
        sessionStorage.setItem(key, value);
      });

      // Unregister service worker for clean update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('[VersionManager] Service workers unregistered');
      }
    } catch (error) {
      console.warn('[VersionManager] Error clearing caches:', error);
    }
  };

  const performHardReload = async () => {
    // Store reload timestamp to prevent reload loops
    localStorage.setItem('last_app_reload', Date.now().toString());
    
    await clearAllCaches();
    
    // Hard reload - multiple approaches for maximum compatibility
    if (window.location.reload) {
      // Modern browsers
      window.location.reload();
    } else {
      // Fallback
      window.location.href = window.location.href;
    }
  };

  const startUpdateCountdown = () => {
    setCountdownSeconds(5);
    
    toast({
      title: "Update Available",
      description: `Refreshing in ${5} seconds to apply new version...`,
      duration: 5000,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancelUpdate}
        >
          Cancel
        </Button>
      ),
    });

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Set timeout for actual update
    updateTimeoutRef.current = setTimeout(() => {
      performHardReload();
    }, 5000);
  };

  const handleCancelUpdate = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    setPendingUpdate(true); // Keep pending flag for later
    toast({
      title: "Update Postponed",
      description: "The update will be applied when you navigate to a different page.",
      duration: 4000,
    });
  };

  const handleUpdateNow = () => {
    performHardReload();
  };

  // Check if user navigated away from sensitive path
  useEffect(() => {
    if (pendingUpdate) {
      const isSensitive = SENSITIVE_PATHS.some(path => 
        location.pathname.startsWith(path)
      );

      // If moved away from sensitive path, trigger update
      if (!isSensitive && isInSensitivePath) {
        console.log('[VersionManager] User left sensitive area, applying update');
        startUpdateCountdown();
      }
    }
  }, [location.pathname, pendingUpdate, isInSensitivePath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};
