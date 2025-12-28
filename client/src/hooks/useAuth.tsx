// client/src/hooks/useAuth.tsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
}

export const useAuth = () => {
  const [, setLocation] = useLocation();

  const { data: user, isLoading, isError, error } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // TanStack Query v5: cacheTime renamed to gcTime
  });

  // Handle redirect on auth state change
  useEffect(() => {
    if (!isLoading) {
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!user && !isAuthPage) {
        setLocation('/login');
      }
    }
  }, [user, isLoading, setLocation]);

  // Log errors
  useEffect(() => {
    if (isError && error) {
      console.error("Auth hook error:", error);
    }
  }, [isError, error]);

  return {
    user: user === null ? undefined : user,
    isLoading,
    isLoggedIn: !!user,
    isError,
    error,
  };
};