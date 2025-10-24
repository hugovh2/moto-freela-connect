/**
 * Safe Navigation Utilities
 * Prevents crashes during navigation by validating state and handling errors
 */

import { NavigateFunction } from 'react-router-dom';

interface NavigationOptions {
  replace?: boolean;
  state?: any;
  onError?: (error: Error) => void;
}

/**
 * Safely navigates to a route with error handling and validation
 * @param navigate - React Router navigate function
 * @param path - Target route path
 * @param options - Navigation options
 */
export const safeNavigate = (
  navigate: NavigateFunction | null | undefined,
  path: string,
  options: NavigationOptions = {}
): boolean => {
  try {
    // Validate navigator exists
    if (!navigate || typeof navigate !== 'function') {
      console.error('[Navigation] Navigator function is not available');
      return false;
    }

    // Validate path
    if (!path || typeof path !== 'string') {
      console.error('[Navigation] Invalid path provided:', path);
      return false;
    }

    // Execute navigation
    navigate(path, {
      replace: options.replace,
      state: options.state,
    });

    console.log(`[Navigation] Successfully navigated to: ${path}`);
    return true;
  } catch (error) {
    const err = error as Error;
    console.error('[Navigation] Error during navigation:', err);
    
    if (options.onError) {
      options.onError(err);
    }
    
    return false;
  }
};

/**
 * Delays navigation to allow UI updates and state synchronization
 * @param navigate - React Router navigate function
 * @param path - Target route path
 * @param delayMs - Delay in milliseconds (default: 300ms)
 * @param options - Navigation options
 */
export const delayedNavigate = async (
  navigate: NavigateFunction | null | undefined,
  path: string,
  delayMs: number = 300,
  options: NavigationOptions = {}
): Promise<boolean> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = safeNavigate(navigate, path, options);
      resolve(success);
    }, delayMs);
  });
};

/**
 * Navigates with a loading state to prevent multiple clicks
 * @param navigate - React Router navigate function
 * @param path - Target route path
 * @param setLoading - Loading state setter
 * @param options - Navigation options
 */
export const navigateWithLoading = async (
  navigate: NavigateFunction | null | undefined,
  path: string,
  setLoading: (loading: boolean) => void,
  options: NavigationOptions = {}
): Promise<boolean> => {
  try {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for UI feedback
    const success = safeNavigate(navigate, path, options);
    return success;
  } finally {
    // Keep loading state for a moment to prevent flicker
    setTimeout(() => setLoading(false), 200);
  }
};

/**
 * Validates if a route path is valid
 * @param path - Route path to validate
 */
export const isValidRoute = (path: string): boolean => {
  const validRoutes = [
    '/',
    '/auth',
    '/company',
    '/motoboy',
    '/test-native',
    '/debug',
  ];
  
  return validRoutes.includes(path) || path.startsWith('/');
};

/**
 * Gets the appropriate dashboard route based on user role
 * @param role - User role ('company' | 'motoboy')
 */
export const getDashboardRoute = (role: string | null | undefined): string => {
  if (!role) {
    console.warn('[Navigation] No role provided, defaulting to auth');
    return '/auth';
  }
  
  switch (role) {
    case 'company':
      return '/company';
    case 'motoboy':
      return '/motoboy';
    default:
      console.warn(`[Navigation] Unknown role: ${role}, defaulting to auth`);
      return '/auth';
  }
};
