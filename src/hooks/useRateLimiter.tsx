import { useState, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  blockedUntil: number | null;
}

export const useRateLimiter = (
  key: string,
  config: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes
  }
) => {
  const stateRef = useRef<Map<string, RateLimitState>>(new Map());

  const checkRateLimit = useCallback(
    (identifier: string): boolean => {
      const now = Date.now();
      const rateLimitKey = `${key}_${identifier}`;
      const state = stateRef.current.get(rateLimitKey);

      // Check if blocked
      if (state?.blockedUntil && now < state.blockedUntil) {
        const remainingMs = state.blockedUntil - now;
        const remainingMin = Math.ceil(remainingMs / 60000);
        toast({
          title: 'Rate Limit Exceeded',
          description: `Too many attempts. Please wait ${remainingMin} minute(s).`,
          variant: 'destructive',
        });
        return false;
      }

      // Initialize or reset window
      if (!state || now - state.windowStart > config.windowMs) {
        stateRef.current.set(rateLimitKey, {
          attempts: 1,
          windowStart: now,
          blockedUntil: null,
        });
        return true;
      }

      // Increment attempts
      const newAttempts = state.attempts + 1;

      if (newAttempts > config.maxAttempts) {
        // Block the identifier
        const blockedUntil = now + config.blockDurationMs;
        stateRef.current.set(rateLimitKey, {
          ...state,
          attempts: newAttempts,
          blockedUntil,
        });
        
        toast({
          title: 'Rate Limit Exceeded',
          description: `Too many attempts. Blocked for ${config.blockDurationMs / 60000} minutes.`,
          variant: 'destructive',
        });
        return false;
      }

      stateRef.current.set(rateLimitKey, {
        ...state,
        attempts: newAttempts,
      });

      return true;
    },
    [key, config]
  );

  const resetRateLimit = useCallback(
    (identifier: string) => {
      const rateLimitKey = `${key}_${identifier}`;
      stateRef.current.delete(rateLimitKey);
    },
    [key]
  );

  return { checkRateLimit, resetRateLimit };
};
