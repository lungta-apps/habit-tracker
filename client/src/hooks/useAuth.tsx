// client/src/hooks/useAuth.tsx
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface User {
  id: string;
  username: string;
  // Add other user properties you might fetch
}

export const useAuth = () => {
  const [, setLocation] = useLocation(); // To trigger a re-render if auth state changes and we need to navigate

  const { data: user, isLoading, isError, error } = useQuery<User | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, return null user to indicate
          return null;
        }
        throw new Error('Failed to fetch user');
      }
      return response.json();
    },
    retry: false, // Don't retry on 401 for example
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
    cacheTime: 10 * 60 * 1000, // 10 minutes cache time
    onSuccess: (data) => {
      // If user logs out, data will be null
      if (!data) {
        // Optionally redirect to login if we land on a protected page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          setLocation('/login');
        }
      }
    },
    onError: (err) => {
      console.error("Auth hook error:", err);
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        setLocation('/login');
      }
    }
  });

  return {
    user: user === null ? undefined : user, // Return undefined if explicitly not authenticated
    isLoading,
    isLoggedIn: !!user,
    isError,
    error,
  };
};