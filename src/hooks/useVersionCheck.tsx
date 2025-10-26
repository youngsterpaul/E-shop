import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionInfo {
  version: string;
  timestamp: number;
  buildId: string;
}

interface UseVersionCheckOptions {
  checkInterval?: number; // in milliseconds
  onUpdateAvailable?: (newVersion: VersionInfo) => void;
  enabled?: boolean;
}

export const useVersionCheck = (options: UseVersionCheckOptions = {}) => {
  const {
    checkInterval = 2 * 60 * 1000, // 2 minutes default
    onUpdateAvailable,
    enabled = true
  } = options;

  const [currentVersion, setCurrentVersion] = useState<VersionInfo | null>(null);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout>();
  const hasNotifiedRef = useRef(false);

  const fetchVersion = useCallback(async (): Promise<VersionInfo | null> => {
    try {
      // Add cache busting to ensure fresh fetch
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        console.warn('[VersionCheck] Failed to fetch version.json:', response.status);
        return null;
      }

      const data: VersionInfo = await response.json();
      return data;
    } catch (error) {
      console.warn('[VersionCheck] Error fetching version:', error);
      return null;
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!enabled || isChecking) return;

    setIsChecking(true);
    
    try {
      const latestVersion = await fetchVersion();
      
      if (!latestVersion) {
        setIsChecking(false);
        return;
      }

      // Initialize current version on first check
      if (!currentVersion) {
        setCurrentVersion(latestVersion);
        localStorage.setItem('app_version', JSON.stringify(latestVersion));
        setIsChecking(false);
        return;
      }

      // Check if version has changed
      const hasNewVersion = 
        latestVersion.version !== currentVersion.version ||
        latestVersion.timestamp !== currentVersion.timestamp ||
        latestVersion.buildId !== currentVersion.buildId;

      if (hasNewVersion && !hasNotifiedRef.current) {
        console.log('[VersionCheck] New version detected:', latestVersion);
        setNewVersionAvailable(true);
        hasNotifiedRef.current = true;
        
        if (onUpdateAvailable) {
          onUpdateAvailable(latestVersion);
        }
      }
    } catch (error) {
      console.warn('[VersionCheck] Error during version check:', error);
    } finally {
      setIsChecking(false);
    }
  }, [currentVersion, enabled, fetchVersion, isChecking, onUpdateAvailable]);

  const clearUpdate = useCallback(() => {
    setNewVersionAvailable(false);
    hasNotifiedRef.current = false;
  }, []);

  // Initial version check
  useEffect(() => {
    if (!enabled) return;

    const initVersion = async () => {
      // Try to get cached version
      const cached = localStorage.getItem('app_version');
      if (cached) {
        try {
          setCurrentVersion(JSON.parse(cached));
        } catch (e) {
          console.warn('[VersionCheck] Failed to parse cached version');
        }
      }

      // Immediately check for updates
      await checkForUpdate();
    };

    initVersion();
  }, [enabled]); // Only run once on mount

  // Set up periodic checking
  useEffect(() => {
    if (!enabled || !currentVersion) return;

    checkIntervalRef.current = setInterval(() => {
      checkForUpdate();
    }, checkInterval);

    // Check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, currentVersion, checkInterval, checkForUpdate]);

  return {
    currentVersion,
    newVersionAvailable,
    isChecking,
    checkForUpdate,
    clearUpdate
  };
};
