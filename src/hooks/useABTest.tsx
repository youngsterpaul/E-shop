import { useEffect, useState } from 'react';

interface ABTestConfig {
  testId: string;
  variants: string[];
  weights?: number[]; // Optional weights for each variant (must sum to 1)
}

interface ABTestResult {
  variant: string;
  trackConversion: (conversionValue?: number) => void;
  isVariant: (variantName: string) => boolean;
}

/**
 * A/B Testing Hook
 * 
 * Usage:
 * const { variant, trackConversion, isVariant } = useABTest({
 *   testId: 'hero-layout-test',
 *   variants: ['control', 'variant-a', 'variant-b'],
 *   weights: [0.5, 0.25, 0.25] // Optional: 50% control, 25% each variant
 * });
 * 
 * // Render different components based on variant
 * {isVariant('variant-a') && <NewHeroLayout />}
 * {isVariant('control') && <OriginalHeroLayout />}
 * 
 * // Track conversions
 * <button onClick={() => trackConversion(29.99)}>Buy Now</button>
 */
export function useABTest({ testId, variants, weights }: ABTestConfig): ABTestResult {
  const [variant, setVariant] = useState<string>('');

  useEffect(() => {
    // Check if user already has an assigned variant
    const storageKey = `ab_test_${testId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored && variants.includes(stored)) {
      setVariant(stored);
    } else {
      // Assign new variant based on weights or equal distribution
      const assignedVariant = assignVariant(variants, weights);
      localStorage.setItem(storageKey, assignedVariant);
      setVariant(assignedVariant);

      // Track assignment
      trackEvent('ab_test_assigned', {
        testId,
        variant: assignedVariant,
        timestamp: Date.now()
      });
    }
  }, [testId, variants, weights]);

  const trackConversion = (conversionValue?: number) => {
    trackEvent('ab_test_conversion', {
      testId,
      variant,
      conversionValue,
      timestamp: Date.now()
    });
  };

  const isVariant = (variantName: string): boolean => {
    return variant === variantName;
  };

  return {
    variant,
    trackConversion,
    isVariant
  };
}

// Assign variant based on weights or equal distribution
function assignVariant(variants: string[], weights?: number[]): string {
  if (!weights || weights.length !== variants.length) {
    // Equal distribution
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex];
  }

  // Weighted distribution
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < variants.length; i++) {
    cumulative += weights[i];
    if (random <= cumulative) {
      return variants[i];
    }
  }

  return variants[0]; // Fallback
}

// Track event (integrates with Google Analytics if available)
function trackEvent(eventName: string, eventData: any) {
  // Store in localStorage for analytics
  const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
  events.push({ eventName, ...eventData });
  
  // Keep only last 100 events
  if (events.length > 100) {
    events.shift();
  }
  
  localStorage.setItem('ab_test_events', JSON.stringify(events));

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, eventData);
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[A/B Test]', eventName, eventData);
  }
}

/**
 * Get A/B test results from localStorage
 * Useful for admin dashboard to view test performance
 */
export function getABTestResults(): any[] {
  return JSON.parse(localStorage.getItem('ab_test_events') || '[]');
}

/**
 * Clear A/B test data (useful for testing)
 */
export function clearABTestData(testId?: string) {
  if (testId) {
    localStorage.removeItem(`ab_test_${testId}`);
  } else {
    // Clear all A/B test data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ab_test_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('ab_test_events');
  }
}
