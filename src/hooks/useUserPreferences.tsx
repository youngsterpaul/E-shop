<<<<<<< HEAD
import { useState, useEffect, useCallback } from 'react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: 'KES' | 'USD';
  language: 'en' | 'sw';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  layout: 'grid' | 'list';
  itemsPerPage: 12 | 24 | 48;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  currency: 'KES',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  layout: 'grid',
  itemsPerPage: 24,
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      try {
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      } catch (error) {
        console.warn('Failed to save user preferences:', error);
      }
      return newPreferences;
    });
  }, []);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem('userPreferences');
    } catch (error) {
      console.warn('Failed to reset user preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
=======
import { useState, useEffect, useCallback } from 'react';

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  currency: 'KES' | 'USD';
  language: 'en' | 'sw';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  layout: 'grid' | 'list';
  itemsPerPage: 12 | 24 | 48;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  currency: 'KES',
  language: 'en',
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  layout: 'grid',
  itemsPerPage: 24,
};

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      try {
        localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
      } catch (error) {
        console.warn('Failed to save user preferences:', error);
      }
      return newPreferences;
    });
  }, []);

  // Reset to default preferences
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
    try {
      localStorage.removeItem('userPreferences');
    } catch (error) {
      console.warn('Failed to reset user preferences:', error);
    }
  }, []);

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
  };
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
};