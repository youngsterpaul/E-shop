import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // 2 minutes before timeout

export const useSessionTimeout = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleTimeout = useCallback(async () => {
    clearTimers();
    await signOut();
    toast({
      title: 'Session Expired',
      description: 'Your session has expired due to inactivity. Please sign in again.',
      variant: 'destructive',
    });
    navigate('/auth');
  }, [signOut, navigate, clearTimers]);

  const showWarning = useCallback(() => {
    toast({
      title: 'Session Expiring Soon',
      description: 'Your session will expire in 2 minutes due to inactivity.',
      duration: 10000,
    });
  }, []);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    
    // Throttle reset to avoid too many timer resets
    if (now - lastActivityRef.current < 1000) {
      return;
    }
    
    lastActivityRef.current = now;
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(showWarning, SESSION_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Set timeout timer
    timeoutRef.current = setTimeout(handleTimeout, SESSION_TIMEOUT_MS);
  }, [clearTimers, handleTimeout, showWarning]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Activity events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timer on activity
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
      clearTimers();
    };
  }, [user, resetTimer, clearTimers]);

  return { resetTimer };
};
