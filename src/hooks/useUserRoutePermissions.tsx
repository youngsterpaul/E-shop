import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export const useUserRoutePermissions = (userId: string | undefined) => {
  const { isSuperAdmin, roles, loading: rolesLoading } = useUserRole(userId);

  const { data: allowedRoutes, isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-route-permissions', userId, roles],
    queryFn: async () => {
      if (!userId || isSuperAdmin) return null; // Superadmins have all access

      const { data, error } = await supabase
        .from('admin_route_permissions')
        .select('route_path')
        .in('role', roles)
        .eq('is_allowed', true);

      if (error) throw error;
      return new Set(data?.map(p => p.route_path) || []);
    },
    enabled: !!userId && !isSuperAdmin && roles.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const canAccessRoute = (routePath: string): boolean => {
    if (isSuperAdmin) return true;
    if (!allowedRoutes) return false;
    return allowedRoutes.has(routePath);
  };

  return {
    allowedRoutes,
    canAccessRoute,
    isLoading: rolesLoading || permissionsLoading,
    isSuperAdmin,
  };
};
