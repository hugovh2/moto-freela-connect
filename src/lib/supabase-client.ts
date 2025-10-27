/**
 * Enhanced Supabase Client
 * Provides improved error handling, token refresh, and session management
 */

import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
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
      // Usar localStorage padrão ao invés de storage customizado
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });

  // Set up auth state change listener
  client.auth.onAuthStateChange((event, session) => {
    console.log('[Supabase] Auth state changed:', event);
    
    if (event === 'TOKEN_REFRESHED' && session?.access_token) {
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
 * Retorna o usuário autenticado em caso de sucesso
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: Record<string, any>
) => {
  try {
    // Garantir que os metadados estejam no formato correto
    const role = metadata?.role || 'motoboy';
    const userMetadata = {
      full_name: metadata?.full_name || 'Usuário',
      role: role,
      ...metadata
    };

    console.log('[Supabase] Criando conta com role:', role);

    // 1. Criar conta no Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userMetadata,
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpError) {
      console.error('[Supabase] Sign up error:', signUpError);
      handleAuthError(signUpError, 'sign-up');
      return { data: null, error: signUpError };
    }

    // 2. Se a conta foi criada com sucesso, fazer login
    if (signUpData.user) {
      // 2.1 Garantir que o perfil foi criado com a role correta
      const userId = signUpData.user.id;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: userMetadata.full_name,
          role: role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('[Supabase] Error updating profile role:', profileError);
      }

      // 2.2 Fazer login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[Supabase] Auto login after signup failed:', signInError);
        return { data: signUpData, error: signInError };
      }

      // 3. Buscar o perfil completo do usuário
      const userProfile = await getUserProfile(userId);
      
      console.log('[Supabase] Usuário autenticado com sucesso:', {
        userId,
        role: userProfile?.role || 'não definido',
        userMetadata: signInData.user?.user_metadata
      });
      
      return { 
        data: { 
          ...signInData, 
          profile: {
            ...userProfile,
            // Garante que a role está correta
            role: role
          }
        }, 
        error: null 
      };
    }

    return { data: signUpData, error: null };
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

    return true;
  } catch (error) {
    console.error('[Supabase] Sign out exception:', error);
    handleNetworkError(error);
    return false;
  }
};

// Definindo o tipo do perfil do usuário
type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: 'company' | 'motoboy' | 'admin' | 'moderator';
  phone?: string;
  avatar_url?: string;
  rating?: number;
  total_jobs?: number;
  created_at: string;
  updated_at: string;
};

/**
 * Gets user profile from database
 * Retorna um perfil padrão se não encontrar
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  
  try {
    console.log('[getUserProfile] Buscando perfil para:', userId);
    
    // Adicionar timeout para evitar travamento no Android
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao buscar perfil')), 10000);
    });

    const queryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('[getUserProfile] Erro ao buscar perfil:', error);
      
      // Se o perfil não existir, não é erro crítico
      if (error.code === 'PGRST116') {
        console.log('[getUserProfile] Perfil não encontrado, retornando null');
        return null;
      }
      
      // Em caso de erro, retorna null ao invés de lançar exceção
      console.warn('[getUserProfile] Retornando null devido a erro');
      return null;
    }

    if (!data) {
      console.log('[getUserProfile] Nenhum dado retornado');
      return null;
    }

    console.log('[getUserProfile] Perfil encontrado:', { id: data.id, role: data.role });
    
    return {
      id: data.id,
      email: data.email || '',
      full_name: data.full_name || 'Usuário',
      role: data.role as 'company' | 'motoboy' | 'admin' | 'moderator',
      phone: data.phone,
      avatar_url: data.avatar_url,
      rating: data.rating,
      total_jobs: data.total_jobs,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('[getUserProfile] Erro inesperado:', error);
    return null;
  }
};

/**
 * Gets user role from profiles table
 */
export const getUserRole = async (userId: string): Promise<'company' | 'motoboy' | 'admin' | 'moderator' | null> => {
  if (!userId) return null;
  
  try {
    console.log('[getUserRole] Buscando role para:', userId);
    
    // Adicionar timeout para evitar travamento no Android
    const timeoutPromise = new Promise<any>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao buscar role')), 10000);
    });
    
    // Primeiro tenta buscar da tabela user_roles (se existir e funcionar)
    try {
      const roleQueryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
        
      const { data: userRole, error: roleError } = await Promise.race([roleQueryPromise, timeoutPromise]);

      if (!roleError && userRole?.role) {
        console.log('[getUserRole] Role found in user_roles table:', userRole.role);
        return userRole.role as any;
      }
    } catch (e) {
      console.warn('[getUserRole] Error querying user_roles table, falling back to profiles table');
    }

    // Se não encontrar em user_roles, tenta buscar do perfil
    const profileQueryPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    const { data: profile, error } = await Promise.race([profileQueryPromise, timeoutPromise]);

    if (error || !profile) {
      console.warn('[getUserRole] Profile not found, using default role (motoboy)');
      return 'motoboy';
    }

    // Verifica se a role existe no perfil (usando type assertion para evitar erros de tipo)
    const profileWithRole = profile as any;
    if (profileWithRole.role) {
      console.log('[Supabase] Role found in profiles table:', profileWithRole.role);
      return profileWithRole.role as 'company' | 'motoboy' | 'admin' | 'moderator';
    }
    
    // Se não encontrar a role, retorna o valor padrão
    console.log('[Supabase] No role found, using default (motoboy)');
    return 'motoboy';
  } catch (error) {
    console.error('[Supabase] Get role exception:', error);
    // Em caso de erro, retorna motoboy como padrão para não quebrar o sistema
    return 'motoboy';
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
