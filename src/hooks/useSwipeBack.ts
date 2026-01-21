import { useEffect } from 'react';

export const useSwipeBack = (navigate: any) => {
  useEffect(() => {
    let startX = 0;

    const touchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const touchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;

      if (diff > 100) { // swipe right
        navigate(-1); // go back
      }
    };

    window.addEventListener('touchstart', touchStart);
    window.addEventListener('touchend', touchEnd);

    return () => {
      window.removeEventListener('touchstart', touchStart);
      window.removeEventListener('touchend', touchEnd);
    };
  }, [navigate]);
};
