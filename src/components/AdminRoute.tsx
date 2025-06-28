
import React from 'react';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  // TODO: Implement actual admin authentication logic
  const isAdmin = false; // This should be replaced with actual admin check
  
  if (!isAdmin) {
    return <Navigate to="/auth/signin" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
