import { useEffect, useRef } from "react";
import LoadingBar from "react-top-loading-bar";
import { useLocation } from "react-router-dom";

const TopProgressBar = () => {
  const ref = useRef<any>(null);
  const location = useLocation();

  useEffect(() => {
    ref.current?.continuousStart();
    const timeout = setTimeout(() => {
      ref.current?.complete();
    }, 800); // simulate loading time
    return () => clearTimeout(timeout);
  }, [location]);

  return <LoadingBar color="#ff5722" ref={ref} height={2} shadow={true} />;
};

export default TopProgressBar;
