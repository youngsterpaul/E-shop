<<<<<<< HEAD

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { isMobileUserAgent } from "@/hooks/use-mobile";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <main className="max-w-md w-full text-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-24 w-24 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. The page may have been moved, deleted, 
            or may have never existed.
          </p>
          <div className="space-y-4">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate("/")}
            >
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default NotFound;
=======

import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { isMobileUserAgent } from "@/hooks/use-mobile";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = isMobileUserAgent();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <main className="max-w-md w-full text-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="flex justify-center mb-6">
            <AlertTriangle className="h-24 w-24 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. The page may have been moved, deleted, 
            or may have never existed.
          </p>
          <div className="space-y-4">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600"
              onClick={() => navigate("/")}
            >
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </main>
      
    </div>
  );
};

export default NotFound;
>>>>>>> 980d81d973590628cdbc798c69baa4bf7ed0b48e
