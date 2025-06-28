
// Utility functions for cleanup and optimization
export const cleanupLocalStorage = () => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Remove old cart sessions (older than 30 days)
      if (key.startsWith('cart_session_') && isOldSession(key)) {
        keysToRemove.push(key);
      }
      
      // Remove expired search history
      if (key.startsWith('search_history_') && isExpiredSearchHistory(key)) {
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

const isOldSession = (key: string): boolean => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return true;
    
    const parsed = JSON.parse(data);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return parsed.timestamp < thirtyDaysAgo;
  } catch {
    return true;
  }
};

const isExpiredSearchHistory = (key: string): boolean => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return true;
    
    const parsed = JSON.parse(data);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return parsed.timestamp < sevenDaysAgo;
  } catch {
    return true;
  }
};

// Run cleanup on app initialization
export const initCleanup = () => {
  // Clean up immediately
  cleanupLocalStorage();
  
  // Set up periodic cleanup (every 24 hours)
  setInterval(cleanupLocalStorage, 24 * 60 * 60 * 1000);
};
