import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface SuperadminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function SuperadminOnly({ children, fallback = null }: SuperadminOnlyProps) {
  const { user } = useAuth();
  const { isSuperAdmin, loading } = useUserRole(user?.id);

  if (loading) return null;
  
  if (!isSuperAdmin) return <>{fallback}</>;
  
  return <>{children}</>;
}

// Hook version for more flexibility
export function useSuperadminCheck() {
  const { user } = useAuth();
  const { isSuperAdmin, loading } = useUserRole(user?.id);
  
  return { isSuperAdmin, loading };
}
