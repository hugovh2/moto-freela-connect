/**
 * Protected Route Component
 * Prevents unauthorized access to protected pages
 */

import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase, getCurrentUser, getUserProfile } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'company' | 'motoboy' | null;
  redirectTo?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole = null,
  redirectTo = '/auth' 
}: ProtectedRouteProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuthorization();
  }, [location.pathname]);

  const checkAuthorization = async () => {
    try {
      setIsLoading(true);

      // Check if user is authenticated
      const user = await getCurrentUser();

      if (!user) {
        console.log('[ProtectedRoute] No user found, redirecting to auth');
        setRedirectPath(redirectTo);
        setIsAuthorized(false);
        return;
      }

      // If no specific role required, just check authentication
      if (!requiredRole) {
        setIsAuthorized(true);
        return;
      }

      // Check user role
      const profile = await getUserProfile(user.id);

      if (!profile) {
        console.log('[ProtectedRoute] No profile found, redirecting to auth');
        setRedirectPath(redirectTo);
        setIsAuthorized(false);
        return;
      }

      // Verify role matches
      if (profile.role !== requiredRole) {
        console.log(`[ProtectedRoute] Role mismatch: expected ${requiredRole}, got ${profile.role}`);
        // Redirect to appropriate dashboard
        const correctPath = profile.role === 'company' ? '/company' : '/motoboy';
        setRedirectPath(correctPath);
        setIsAuthorized(false);
        return;
      }

      // All checks passed
      setIsAuthorized(true);
    } catch (error) {
      console.error('[ProtectedRoute] Authorization check failed:', error);
      setRedirectPath(redirectTo);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Verificando autenticação...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirect if not authorized
  if (!isAuthorized && redirectPath) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Hook to check if user has required role
 */
export const useRequireAuth = (requiredRole?: 'company' | 'motoboy') => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      const profile = await getUserProfile(user.id);
      
      if (!profile) {
        setIsAuthorized(false);
        return;
      }

      setUserRole(profile.role);

      if (!requiredRole || profile.role === requiredRole) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    } catch (error) {
      console.error('[useRequireAuth] Error:', error);
      setIsAuthorized(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { isAuthorized, isLoading, userRole, refetch: checkAuth };
};
