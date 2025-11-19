import { useEffect } from 'react';
import { initOfflineDB, cleanupExpiredCache } from '@/utils/offlineStorage';

export function OfflineCacheManager() {
  useEffect(() => {
    // Initialize offline database
    initOfflineDB().then(() => {
      console.log('Offline database initialized');
    });

    // Cleanup expired cache daily
    const cleanupInterval = setInterval(() => {
      cleanupExpiredCache();
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Run cleanup on mount
    cleanupExpiredCache();

    return () => clearInterval(cleanupInterval);
  }, []);

  return null;
}
