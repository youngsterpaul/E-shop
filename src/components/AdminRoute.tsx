import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole, AppRole } from '@/hooks/useUserRole';
import { useCheckRouteAccess } from '@/hooks/useRoutePermissions';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AdminRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole; // Kept for backwards compatibility, but now uses DB permissions
}

const AdminRoute = ({ children, requiredRole = 'admin' }: AdminRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { loading: rolesLoading, isSuperAdmin, hasAnyAdminRole } = useUserRole(user?.id);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Get the base route path (without dynamic segments)
  const getBaseRoutePath = (path: string) => {
    // Handle edit routes by removing the dynamic ID part
    const editMatch = path.match(/^(\/admin\/[^/]+\/edit)/);
    if (editMatch) return editMatch[1].replace(/\/edit$/, '');
    
    // Handle view routes like /customers/:id
    const viewMatch = path.match(/^(\/admin\/[^/]+)\/[^/]+$/);
    if (viewMatch && !path.includes('/add') && !path.includes('/create')) {
      return viewMatch[1];
    }
    
    return path;
  };

  const routePath = getBaseRoutePath(location.pathname);
  const { hasAccess: hasRouteAccess, loading: permissionLoading } = useCheckRouteAccess(user?.id, routePath);

  const loading = authLoading || rolesLoading || permissionLoading;

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

    // Must have at least one admin role
    if (!hasAnyAdminRole) {
      setError('You do not have admin privileges');
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this area",
        variant: "destructive",
      });
      navigate('/', { replace: true });
      return;
    }

    // Superadmins always have access
    if (isSuperAdmin) {
      return;
    }

    // Check route-specific permissions from database
    if (hasRouteAccess === false) {
      setError('You do not have permission to access this page');
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page. Contact a superadmin for access.",
        variant: "destructive",
      });
      navigate('/admin', { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id, isSuperAdmin, hasAnyAdminRole, hasRouteAccess, routePath]);
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
              onClick={() => navigate('/', { replace: true })}
              className="text-orange-500 hover:text-orange-600 underline"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Double check access for final render - superadmins always have access, others need route permission
  if (!isSuperAdmin && hasRouteAccess === false) return null;

  return <>{children}</>;
};

export default AdminRoute;