import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'superadmin' | 'admin' | 'moderator' | 'user';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRole = (userId: string | undefined) => {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId);

        if (fetchError) throw fetchError;

        const userRoles = (data as UserRole[])?.map(r => r.role) || [];
        setRoles(userRoles);
      } catch (err) {
        console.error('Error fetching user roles:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [userId]);

  const hasRole = (role: AppRole) => roles.includes(role);
  const isSuperAdmin = hasRole('superadmin');
  const isAdmin = hasRole('admin') || hasRole('superadmin');
  const hasAnyAdminRole = isAdmin;

  return {
    roles,
    loading,
    error,
    hasRole,
    isSuperAdmin,
    isAdmin,
    hasAnyAdminRole,
  };
};
