// client/src/components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Redirect } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    // Optionally render a loading spinner or skeleton
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isLoggedIn) {
    // Redirect to login page if not authenticated
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
