<<<<<<< HEAD
import { useEffect } from "react";

/**
 * CacheManager:
 * - Keeps your app always up to date with the latest deployment
 * - Clears stale caches on version change
 * - Avoids infinite reload loops
 * - Adds lightweight preconnects for performance
 */

export const CacheManager = () => {
  useEffect(() => {
    const appVersion = import.meta.env.VITE_APP_VERSION ?? "1.0.0";
    const storedVersion = localStorage.getItem("app_version");

    /**
     * 🧹 Clear stale cache when version changes
     */
    const clearStaleCache = () => {
      console.info("[CacheManager] App version updated:", storedVersion, "→", appVersion);

      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("app_version", appVersion);

        // 👋 Give the browser a moment before reload to flush changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.warn("[CacheManager] Cache clear failed:", error);
      }
    };

    /**
     * 🧠 Version management
     */
    if (!storedVersion) {
      // First-time visitor → store current version
      localStorage.setItem("app_version", appVersion);
    } else if (storedVersion !== appVersion) {
      clearStaleCache();
    }

    /**
     * ⚡ Performance optimizations
     * Add preconnects and DNS prefetch for external APIs/CDNs
     */
    const addLinkTag = (rel: string, href: string, crossorigin = false) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = rel;
        link.href = href;
        if (crossorigin) link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    };

    // Example: Preconnect to your Supabase project
    addLinkTag("preconnect", "https://sgpjnbdrmwrupeqhjqpj.supabase.co");

    // Example: Prefetch for Google Fonts
    addLinkTag("dns-prefetch", "//fonts.gstatic.com");

    // Optional: Add others as needed (e.g. analytics, CDN)
    addLinkTag("preconnect", "https://cdn.www.smartkenya.co.ke", true);

  }, []);

  return null;
};
=======
import { useEffect } from "react";

/**
 * CacheManager:
 * - Keeps your app always up to date with the latest deployment
 * - Clears stale caches on version change
 * - Avoids infinite reload loops
 * - Adds lightweight preconnects for performance
 */

export const CacheManager = () => {
  useEffect(() => {
    const appVersion = import.meta.env.VITE_APP_VERSION ?? "1.0.0";
    const storedVersion = localStorage.getItem("app_version");

    /**
     * 🧹 Clear stale cache when version changes
     */
    const clearStaleCache = () => {
      console.info("[CacheManager] App version updated:", storedVersion, "→", appVersion);

      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem("app_version", appVersion);

        // 👋 Give the browser a moment before reload to flush changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.warn("[CacheManager] Cache clear failed:", error);
      }
    };

    /**
     * 🧠 Version management
     */
    if (!storedVersion) {
      // First-time visitor → store current version
      localStorage.setItem("app_version", appVersion);
    } else if (storedVersion !== appVersion) {
      clearStaleCache();
    }

    /**
     * ⚡ Performance optimizations
     * Add preconnects and DNS prefetch for external APIs/CDNs
     */
    const addLinkTag = (rel: string, href: string, crossorigin = false) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = rel;
        link.href = href;
        if (crossorigin) link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }
    };

    // Example: Preconnect to your Supabase project
    addLinkTag("preconnect", "https://sgpjnbdrmwrupeqhjqpj.supabase.co");

    // Example: Prefetch for Google Fonts
    addLinkTag("dns-prefetch", "//fonts.gstatic.com");

    // Optional: Add others as needed (e.g. analytics, CDN)
    addLinkTag("preconnect", "https://cdn.www.smartkenya.co.ke", true);

  }, []);

  return null;
};
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
