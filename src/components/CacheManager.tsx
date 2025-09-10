import { useEffect } from 'react';

export const CacheManager = () => {
  useEffect(() => {
    // Add cache-control meta tags dynamically
    const addMetaTag = (name: string, content: string) => {
      // Remove existing tag if present
      const existing = document.querySelector(`meta[name="${name}"]`);
      if (existing) {
        existing.remove();
      }
      
      // Add new tag
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    };

    // Add HTTP-EQUIV meta tags
    const addHttpEquivTag = (httpEquiv: string, content: string) => {
      const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
      if (existing) {
        existing.remove();
      }
      
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', httpEquiv);
      meta.content = content;
      document.head.appendChild(meta);
    };

    // Add cache control meta tags
    addHttpEquivTag('Cache-Control', 'no-cache, no-store, must-revalidate');
    addHttpEquivTag('Pragma', 'no-cache');
    addHttpEquivTag('Expires', '0');
    
    // Add build timestamp for cache busting
    addMetaTag('build-timestamp', Date.now().toString());
    
    // Add version meta tag (you can update this with actual version)
    addMetaTag('app-version', '1.0.0');

    // Preconnect to critical domains
    const addPreconnect = (href: string, crossorigin = false) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      if (crossorigin) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    };

    // Add preconnects for external resources
    addPreconnect('https://fonts.googleapis.com');
    addPreconnect('https://fonts.gstatic.com', true);
    addPreconnect('https://sgpjnbdrmwrupeqhjqpj.supabase.co');

    // DNS prefetch for faster subsequent requests
    const addDnsPrefetch = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = href;
      document.head.appendChild(link);
    };

    addDnsPrefetch('//fonts.googleapis.com');
    addDnsPrefetch('//fonts.gstatic.com');
    
    // Clear localStorage cache on version mismatch
    const clearCacheOnVersionMismatch = () => {
      const currentVersion = '1.0.0'; // Update this with your app version
      const storedVersion = localStorage.getItem('app_version');
      
      if (storedVersion && storedVersion !== currentVersion) {
        console.log('[Cache] Version mismatch, clearing cache');
        
        // Clear all cache entries
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cache_') || key.startsWith('query_')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear session storage
        sessionStorage.clear();
        
        // Update stored version
        localStorage.setItem('app_version', currentVersion);
      } else if (!storedVersion) {
        localStorage.setItem('app_version', currentVersion);
      }
    };

    clearCacheOnVersionMismatch();

    // Force reload if critical resources fail to load
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Check if it's a critical resource
      if (target.tagName === 'SCRIPT' || target.tagName === 'LINK') {
        console.error('[Cache] Critical resource failed to load, forcing reload');
        // Add a small delay to prevent infinite reload loops
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Listen for resource loading errors
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return null;
};