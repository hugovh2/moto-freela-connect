/**
 * Enhanced Supabase Client
 * Provides improved error handling, token refresh, and session management
 */

import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { TokenStorage } from './secure-storage';
import { handleAuthError, handleNetworkError } from './error-handler';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Track refresh token requests to prevent concurrent refreshes
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Subscribes to token refresh completion
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

/**
 * Notifies all subscribers when token is refreshed
 */
const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

/**
 * Creates enhanced Supabase client with custom storage
 */
const createEnhancedClient = (): SupabaseClient<Database> => {
  const client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: {
        getItem: async (key: string) => {
          try {
            const value = await TokenStorage.getUserSession();
            return value ? JSON.stringify(value) : null;
          } catch (error) {
            console.error('[Supabase] Error getting item:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            const session = JSON.parse(value);
            await TokenStorage.setUserSession(session);
          } catch (error) {
            console.error('[Supabase] Error setting item:', error);
          }
        },
        removeItem: async (key: string) => {
          try {
            await TokenStorage.clearAll();
          } catch (error) {
            console.error('[Supabase] Error removing item:', error);
          }
        },
      },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  // Set up auth state change listener
  client.auth.onAuthStateChange(async (event, session) => {
    console.log('[Supabase] Auth state changed:', event);

    if (event === 'SIGNED_IN' && session) {
      // Store tokens securely
      if (session.access_token) {
        await TokenStorage.setAccessToken(session.access_token);
      }
      if (session.refresh_token) {
        await TokenStorage.setRefreshToken(session.refresh_token);
      }
    } else if (event === 'SIGNED_OUT') {
      // Clear all tokens
      await TokenStorage.clearAll();
    } else if (event === 'TOKEN_REFRESHED' && session) {
      // Update stored tokens
      if (session.access_token) {
        await TokenStorage.setAccessToken(session.access_token);
      }
      if (session.refresh_token) {
        await TokenStorage.setRefreshToken(session.refresh_token);
      }
      onTokenRefreshed(session.access_token);
    }
  });

  return client;
};

// Create singleton instance
export const supabase = createEnhancedClient();

/**
 * Refreshes the authentication token
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  if (isRefreshing) {
    // Wait for ongoing refresh to complete
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Supabase] Token refresh error:', error);
      handleAuthError(error, 'refresh');
      return null;
    }

    if (data.session?.access_token) {
      onTokenRefreshed(data.session.access_token);
      return data.session.access_token;
    }

    return null;
  } catch (error) {
    console.error('[Supabase] Token refresh exception:', error);
    handleNetworkError(error);
    return null;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Gets the current user with error handling
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Try to refresh token if unauthorized
      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Retry getting user
          const { data: retryData, error: retryError } = await supabase.auth.getUser();
          if (retryError) {
            handleAuthError(retryError, 'get-user');
            return null;
          }
          return retryData.user;
        }
      }
      handleAuthError(error, 'get-user');
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('[Supabase] Get user exception:', error);
    handleNetworkError(error);
    return null;
  }
};

/**
 * Signs in with email and password
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      handleAuthError(error, 'sign-in');
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[Supabase] Sign in exception:', error);
    handleNetworkError(error);
    return { data: null, error };
  }
};

/**
 * Signs up with email and password
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      handleAuthError(error, 'sign-up');
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[Supabase] Sign up exception:', error);
    handleNetworkError(error);
    return { data: null, error };
  }
};

/**
 * Signs out the current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      handleAuthError(error, 'sign-out');
      return false;
    }

    // Clear all stored tokens
    await TokenStorage.clearAll();
    return true;
  } catch (error) {
    console.error('[Supabase] Sign out exception:', error);
    handleNetworkError(error);
    return false;
  }
};

/**
 * Gets user profile from database
 */
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[Supabase] Get profile error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Supabase] Get profile exception:', error);
    return null;
  }
};

/**
 * Gets user role from user_roles table
 */
export const getUserRole = async (userId: string): Promise<'company' | 'motoboy' | null> => {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[Supabase] Get role error:', error);
      return null;
    }

    return data?.role as 'company' | 'motoboy' | null;
  } catch (error) {
    console.error('[Supabase] Get role exception:', error);
    return null;
  }
};

/**
 * Checks if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('[Supabase] Check auth exception:', error);
    return false;
  }
};
