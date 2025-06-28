import * as React from "react";

// User-agent detection function
export function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkIsMobile = () => {
      const widthBased = window.innerWidth <= 768;
      const uaBased = isMobileUserAgent();
      setIsMobile(widthBased || uaBased);
    };

    const mql = window.matchMedia("(max-width: 768px)");
    mql.addEventListener("change", checkIsMobile);
    checkIsMobile();

    return () => mql.removeEventListener("change", checkIsMobile);
  }, []);

  return !!isMobile;
}

export default useIsMobile;
