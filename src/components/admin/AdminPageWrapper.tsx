import { ReactNode } from 'react';

interface AdminPageWrapperProps {
  children: ReactNode;
}

/**
 * Simple wrapper for admin pages - handles consistent spacing
 * Use AdminLayout for pages that need sidebar
 */
export function AdminPageWrapper({ children }: AdminPageWrapperProps) {
  return (
    <div className="min-h-screen bg-muted/30">
      {children}
    </div>
  );
}
