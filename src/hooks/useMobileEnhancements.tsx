import { useCallback, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// Haptic feedback types
type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useMobileEnhancements = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Haptic feedback - simulated for web, native for apps
  const haptic = useCallback((type: HapticType = 'light') => {
    if (isNative) {
      // For native, would use Capacitor Haptics plugin
      // import { Haptics, ImpactStyle } from '@capacitor/haptics';
      // await Haptics.impact({ style: ImpactStyle[type] });
    } else if ('vibrate' in navigator) {
      // Web fallback with different durations
      const patterns: Record<HapticType, number | number[]> = {
        light: 10,
        medium: 25,
        heavy: 50,
        success: [10, 50, 10],
        warning: [25, 50, 25],
        error: [50, 30, 50, 30, 50]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [isNative]);

  // Pull to refresh handler
  const handlePullToRefresh = useCallback(async (onRefresh: () => Promise<void>) => {
    setIsRefreshing(true);
    haptic('medium');
    
    try {
      await onRefresh();
      haptic('success');
    } catch (error) {
      haptic('error');
    } finally {
      setIsRefreshing(false);
    }
  }, [haptic]);

  // Touch feedback for buttons
  const touchFeedback = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    haptic('light');
  }, [haptic]);

  // Scroll to top with smooth animation
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    haptic('light');
  }, [haptic]);

  return {
    isNative,
    isRefreshing,
    haptic,
    handlePullToRefresh,
    touchFeedback,
    scrollToTop
  };
};

// Hook for double-tap to zoom prevention
export const usePreventDoubleTapZoom = () => {
  useEffect(() => {
    let lastTouchEnd = 0;
    
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => document.removeEventListener('touchend', handleTouchEnd);
  }, []);
};

// Hook for native-like overscroll effect
export const useOverscrollEffect = (elementRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let startY = 0;
    let startScrollTop = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].pageY;
      startScrollTop = element.scrollTop;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].pageY;
      const dy = y - startY;
      
      // Add rubber-band effect at boundaries
      if ((startScrollTop === 0 && dy > 0) || 
          (startScrollTop + element.clientHeight >= element.scrollHeight && dy < 0)) {
        const resistance = 0.3;
        element.style.transform = `translateY(${dy * resistance}px)`;
      }
    };

    const handleTouchEnd = () => {
      element.style.transition = 'transform 0.3s ease-out';
      element.style.transform = 'translateY(0)';
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef]);
};
