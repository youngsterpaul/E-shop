import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instantly scroll to top when navigating away from home
    if (pathname !== "/") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
