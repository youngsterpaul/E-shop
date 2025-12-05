import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppRole } from './useUserRole';

export interface RoutePermission {
  id: string;
  route_path: string;
  route_name: string;
  route_group: string;
  role: AppRole;
  is_allowed: boolean;
  created_at: string;
  updated_at: string;
}

export const useRoutePermissions = () => {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading, error } = useQuery({
    queryKey: ['route-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_route_permissions')
        .select('*')
        .order('route_group')
        .order('route_name');

      if (error) throw error;
      return data as RoutePermission[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updatePermission = useMutation({
    mutationFn: async ({ id, is_allowed }: { id: string; is_allowed: boolean }) => {
      const { error } = await supabase
        .from('admin_route_permissions')
        .update({ is_allowed, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['route-permissions'] });
    },
  });

  return {
    permissions,
    isLoading,
    error,
    updatePermission,
  };
};

export const useCheckRouteAccess = (userId: string | undefined, routePath: string) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        // Check if user is superadmin (always has access)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roles?.some(r => r.role === 'superadmin')) {
          setHasAccess(true);
          setLoading(false);
          return;
        }

        // For non-superadmins, check route permissions
        const { data: permissions } = await supabase
          .from('admin_route_permissions')
          .select('is_allowed, role')
          .eq('route_path', routePath)
          .eq('is_allowed', true);

        if (!permissions || permissions.length === 0) {
          setHasAccess(false);
          setLoading(false);
          return;
        }

        // Check if user has any of the allowed roles
        const allowedRoles = permissions.map(p => p.role);
        const userRoles = roles?.map(r => r.role) || [];
        const hasPermission = userRoles.some(role => allowedRoles.includes(role));

        setHasAccess(hasPermission);
      } catch (err) {
        console.error('Error checking route access:', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [userId, routePath]);

  return { hasAccess, loading };
};
