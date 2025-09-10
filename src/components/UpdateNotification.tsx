import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, X } from 'lucide-react';

export const UpdateNotification = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE') {
          console.log('[Update] New version available:', event.data.timestamp);
          setShowUpdatePrompt(true);
        }
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setShowUpdatePrompt(true);
        }

        // Listen for new service worker installations
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      });

      // Check for updates periodically
      const checkForUpdates = () => {
        navigator.serviceWorker.ready.then((registration) => {
          registration.update();
        });
      };

      // Check every 30 seconds
      const updateInterval = setInterval(checkForUpdates, 30000);
      
      // Check on visibility change
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          checkForUpdates();
        }
      });

      return () => {
        clearInterval(updateInterval);
        document.removeEventListener('visibilitychange', checkForUpdates);
      };
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        if (registration.waiting) {
          // Tell the waiting service worker to skip waiting
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Listen for controlling service worker change
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        } else {
          // Force reload if no waiting worker
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error('[Update] Failed to update:', error);
      // Fallback to regular reload
      window.location.reload();
    }
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
    // Re-show after 5 minutes
    setTimeout(() => setShowUpdatePrompt(true), 5 * 60 * 1000);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-white border-orange-200 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="h-4 w-4 text-orange-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Update Available
                </h3>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                A new version of SmartKenya is ready. Update now for the latest features and improvements.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 h-7"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Now'
                  )}
                </Button>
                <Button
                  onClick={dismissUpdate}
                  variant="ghost"
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              onClick={dismissUpdate}
              variant="ghost"
              size="sm"
              className="p-0 h-4 w-4 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};