
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
//import Header from "@/components/Header";
//import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      
      <main className="flex-grow flex items-center justify-center bg-gray-50">
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
