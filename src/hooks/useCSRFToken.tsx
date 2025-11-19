import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CSRF_TOKEN_KEY = 'csrf_token';
const TOKEN_EXPIRY_MS = 3600000; // 1 hour

interface CSRFTokenData {
  token: string;
  expiresAt: number;
}

const generateToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const useCSRFToken = () => {
  const [csrfToken, setCSRFToken] = useState<string>('');

  const getToken = (): string => {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    
    if (stored) {
      try {
        const data: CSRFTokenData = JSON.parse(stored);
        
        // Check if token is still valid
        if (Date.now() < data.expiresAt) {
          return data.token;
        }
      } catch (e) {
        // Invalid stored token, generate new one
      }
    }

    // Generate new token
    const newToken = generateToken();
    const data: CSRFTokenData = {
      token: newToken,
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    };
    
    sessionStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(data));
    return newToken;
  };

  const validateToken = (token: string): boolean => {
    const stored = sessionStorage.getItem(CSRF_TOKEN_KEY);
    
    if (!stored) return false;

    try {
      const data: CSRFTokenData = JSON.parse(stored);
      
      // Check token match and expiry
      if (token === data.token && Date.now() < data.expiresAt) {
        return true;
      }
    } catch (e) {
      return false;
    }

    return false;
  };

  const refreshToken = (): string => {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    const newToken = getToken();
    setCSRFToken(newToken);
    return newToken;
  };

  useEffect(() => {
    // Initialize token on mount
    const token = getToken();
    setCSRFToken(token);

    // Set up auth state listener to refresh token on login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        refreshToken();
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem(CSRF_TOKEN_KEY);
        setCSRFToken('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    csrfToken,
    getToken,
    validateToken,
    refreshToken,
  };
};
