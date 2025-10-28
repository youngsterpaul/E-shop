import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole; // 'superadmin' for full access, 'admin' for product access only
}

const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasRole, isSuperAdmin, isAdmin } = useUserRole(user?.id);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loading = authLoading || rolesLoading;

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access admin area",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Check if user has required role
    let hasAccess = false;
    
    if (requiredRole === 'superadmin') {
      hasAccess = isSuperAdmin;
    } else if (requiredRole === 'admin') {
      // Both admin and superadmin can access admin-level routes
      hasAccess = isAdmin || isSuperAdmin;
    } else {
      hasAccess = hasRole(requiredRole);
    }

    if (!hasAccess) {
      const roleNames = {
        'superadmin': 'Super Admin',
        'admin': 'Admin',
        'moderator': 'Moderator',
        'user': 'User'
      };

      setError(`This area requires ${roleNames[requiredRole]} privileges`);
      toast({
        title: "Access Denied",
        description: `You need ${roleNames[requiredRole]} privileges to access this area`,
        variant: "destructive",
      });
      
      // Redirect based on user role
      if (isAdmin) {
        // Admins get redirected to products page
        navigate('/supersmartkenyaadmin123/products');
      } else {
        // Others go to home
        navigate('/');
      }
    }
  }, [user, loading, hasRole, isSuperAdmin, isAdmin, requiredRole, navigate, toast]);

  if (loading) {
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
              onClick={() => {
                if (isAdmin) {
                  navigate('/supersmartkenyaadmin123/products');
                } else {
                  navigate('/');
                }
              }}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              {isAdmin ? 'Go to Products' : 'Return to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Final access check
  let hasAccess = false;
  if (requiredRole === 'superadmin') {
    hasAccess = isSuperAdmin;
  } else if (requiredRole === 'admin') {
    hasAccess = isAdmin || isSuperAdmin;
  } else {
    hasAccess = hasRole(requiredRole);
  }

  if (!hasAccess) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;