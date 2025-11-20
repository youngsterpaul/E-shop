import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: rolesLoading, hasRole, isSuperAdmin, isAdmin, isModerator } = useUserRole(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const loading = authLoading || rolesLoading;

  useEffect(() => {
    if (loading) return;

    // If no user logged in
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to access admin area",
        variant: "destructive",
      });
      navigate('/auth', { replace: true });
      return;
    }

    // Role validation
    let hasAccess = false;
    if (requiredRole === 'superadmin') {
      hasAccess = isSuperAdmin;
    } else if (requiredRole === 'admin') {
      hasAccess = isAdmin || isSuperAdmin;
    } else if (requiredRole === 'moderator') {
      hasAccess = isModerator || isAdmin || isSuperAdmin;
    } else {
      hasAccess = hasRole(requiredRole);
    }

    if (!hasAccess) {
      setError(`You lack ${requiredRole} privileges`);

      toast({
        title: "Access Denied",
        description: `You need ${requiredRole} privileges to access this area`,
        variant: "destructive",
      });

      // Prevent repeated redirects - redirect moderators to products page
      const redirectPath = isAdmin 
        ? '/supersmartkenyaadmin123' 
        : isModerator 
        ? '/supersmartkenyaadmin123/products' 
        : '/';
      navigate(redirectPath, { replace: true });
    }

    // Only run once when user or role state changes from loading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, requiredRole, isAdmin, isSuperAdmin]);

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
                const redirectPath = isAdmin 
                  ? '/supersmartkenyaadmin123/products' 
                  : isModerator 
                  ? '/supersmartkenyaadmin123/products' 
                  : '/';
                navigate(redirectPath, { replace: true });
              }}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              {isAdmin || isModerator ? 'Go to Products' : 'Return to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Double check access for final render
  const hasAccess =
    requiredRole === 'superadmin'
      ? isSuperAdmin
      : requiredRole === 'admin'
      ? isAdmin || isSuperAdmin
      : requiredRole === 'moderator'
      ? isModerator || isAdmin || isSuperAdmin
      : hasRole(requiredRole);

  if (!hasAccess) return null;

  return <>{children}</>;
};

export default AdminRoute;
