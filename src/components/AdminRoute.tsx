
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to access admin area",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      try {
        setIsChecking(true);
        setError(null);
        
        // Use the RPC function to check admin status
        const { data, error } = await supabase
          .rpc('is_admin', { user_id: user.id });

        if (error) {
          console.error('Error checking admin status:', error);
          setError('Failed to verify admin privileges');
          toast({
            title: "Access Denied",
            description: "Unable to verify admin privileges",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        if (!data) {
          setError('Insufficient privileges');
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('Admin check failed:', error);
        setError('System error occurred');
        toast({
          title: "System Error",
          description: "An error occurred while checking admin privileges",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, profile, loading, navigate, toast]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Verifying Access</h2>
            <p className="text-muted-foreground">Please wait while we verify your admin privileges...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <div>
            <h2 className="text-lg font-semibold mb-2 text-red-600">Access Denied</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
