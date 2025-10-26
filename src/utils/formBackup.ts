// Utility for backing up and restoring form data during updates

export const formBackup = {
  /**
   * Backup form data to sessionStorage
   * @param formId - Unique identifier for the form
   * @param data - Form data to backup
   */
  backup: (formId: string, data: Record<string, any>) => {
    try {
      const key = `form_backup_${formId}`;
      const backup = {
        data,
        timestamp: Date.now(),
        url: window.location.pathname
      };
      sessionStorage.setItem(key, JSON.stringify(backup));
      console.log(`[FormBackup] Backed up form: ${formId}`);
    } catch (error) {
      console.warn('[FormBackup] Failed to backup form:', error);
    }
  },

  /**
   * Restore form data from sessionStorage
   * @param formId - Unique identifier for the form
   * @returns Restored form data or null
   */
  restore: <T = Record<string, any>>(formId: string): T | null => {
    try {
      const key = `form_backup_${formId}`;
      const stored = sessionStorage.getItem(key);
      
      if (!stored) return null;

      const backup = JSON.parse(stored);
      
      // Check if backup is less than 1 hour old
      const isValid = Date.now() - backup.timestamp < 60 * 60 * 1000;
      
      if (!isValid) {
        sessionStorage.removeItem(key);
        return null;
      }

      // Check if we're on the same page
      if (backup.url !== window.location.pathname) {
        return null;
      }

      console.log(`[FormBackup] Restored form: ${formId}`);
      return backup.data as T;
    } catch (error) {
      console.warn('[FormBackup] Failed to restore form:', error);
      return null;
    }
  },

  /**
   * Clear a specific form backup
   * @param formId - Unique identifier for the form
   */
  clear: (formId: string) => {
    try {
      const key = `form_backup_${formId}`;
      sessionStorage.removeItem(key);
      console.log(`[FormBackup] Cleared form backup: ${formId}`);
    } catch (error) {
      console.warn('[FormBackup] Failed to clear form backup:', error);
    }
  },

  /**
   * Clear all form backups
   */
  clearAll: () => {
    try {
      const keys = Object.keys(sessionStorage).filter(key => 
        key.startsWith('form_backup_')
      );
      keys.forEach(key => sessionStorage.removeItem(key));
      console.log(`[FormBackup] Cleared ${keys.length} form backups`);
    } catch (error) {
      console.warn('[FormBackup] Failed to clear all form backups:', error);
    }
  },

  /**
   * Get all available form backups
   */
  getAll: (): Array<{ formId: string; timestamp: number; url: string }> => {
    try {
      const backups: Array<{ formId: string; timestamp: number; url: string }> = [];
      
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('form_backup_')) {
          const stored = sessionStorage.getItem(key);
          if (stored) {
            const backup = JSON.parse(stored);
            backups.push({
              formId: key.replace('form_backup_', ''),
              timestamp: backup.timestamp,
              url: backup.url
            });
          }
        }
      });

      return backups;
    } catch (error) {
      console.warn('[FormBackup] Failed to get all backups:', error);
      return [];
    }
  }
};

/**
 * React hook for automatic form backup
 * Usage:
 * 
 * const { backup, restore, clear } = useFormBackup('checkout-form');
 * 
 * // Backup on form change
 * useEffect(() => {
 *   backup(formData);
 * }, [formData]);
 * 
 * // Restore on mount
 * useEffect(() => {
 *   const restored = restore();
 *   if (restored) setFormData(restored);
 * }, []);
 */
export const useFormBackup = (formId: string) => {
  return {
    backup: (data: Record<string, any>) => formBackup.backup(formId, data),
    restore: <T = Record<string, any>>() => formBackup.restore<T>(formId),
    clear: () => formBackup.clear(formId)
  };
};
