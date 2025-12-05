import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <main className="max-w-md w-full text-center">
        <div className="bg-card rounded-2xl border border-border/50 shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            We couldn't find the page you're looking for. The page may have been moved, deleted, 
            or may have never existed.
          </p>
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => navigate("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFound;
