import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { getCacheStats } from "@/utils/offlineStorage";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

export const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useNetworkStatus();
  const { isSyncing, pendingItems, syncNow } = useOfflineSync();
  const [cacheStats, setCacheStats] = useState({ products: 0, categories: 0, images: 0, pendingSync: 0 });
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    getCacheStats().then(setCacheStats).catch(() => {
      // Silently handle errors during cache stats fetch
    });
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  // Show reconnected message briefly
  if (showReconnected) {
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top">
        <div className="bg-success text-success-foreground px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <Wifi className="h-5 w-5" />
          <div>
            <p className="font-medium">Back Online</p>
            {isSyncing && (
              <p className="text-sm opacity-90">Syncing {pendingItems} pending actions...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top max-w-md">
      <div className="bg-muted border border-border px-6 py-4 rounded-lg shadow-lg">
        <div className="flex items-start gap-3">
          <WifiOff className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium text-foreground">Offline Mode</p>
            <p className="text-sm text-muted-foreground mt-1">
              Browsing {cacheStats.products} cached products
            </p>
            {pendingItems > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {pendingItems} actions pending sync
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={syncNow}
                  disabled={isSyncing}
                  className="h-6 text-xs"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    'Retry Sync'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
