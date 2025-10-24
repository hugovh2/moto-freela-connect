/**
 * Auth Store - Zustand
 * Gerenciamento centralizado de autenticação e usuário
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getCurrentUser, getUserProfile, signOut as supabaseSignOut } from '@/lib/supabase-client';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'company' | 'motoboy';
  phone?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
  onboarding_completed?: boolean;
  is_available?: boolean;
  emergency_contact?: string;
  emergency_phone?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthState {
  // State
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadUser: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  reset: () => void;
}

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          error: null 
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      loadUser: async () => {
        const { setLoading, setUser, setError } = get();
        
        try {
          setLoading(true);
          setError(null);
          
          const currentUser = await getCurrentUser();
          
          if (!currentUser) {
            setUser(null);
            return;
          }

          const profile = await getUserProfile(currentUser.id);
          
          if (profile) {
            setUser({
              id: profile.id,
              email: currentUser.email || '',
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
              role: profile.role,
              phone: profile.phone,
              vehicle_type: profile.vehicle_type,
              vehicle_plate: profile.vehicle_plate,
              onboarding_completed: profile.onboarding_completed,
              is_available: profile.is_available,
              emergency_contact: profile.emergency_contact,
              emergency_phone: profile.emergency_phone,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });
          } else {
            setUser(null);
            setError('Perfil não encontrado');
          }
        } catch (error) {
          console.error('[AuthStore] Error loading user:', error);
          setError(error instanceof Error ? error.message : 'Erro ao carregar usuário');
          setUser(null);
        } finally {
          setLoading(false);
        }
      },

      signOut: async () => {
        const { setLoading, reset } = get();
        
        try {
          setLoading(true);
          await supabaseSignOut();
          reset();
        } catch (error) {
          console.error('[AuthStore] Error signing out:', error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      updateProfile: (updates) => {
        const { user } = get();
        if (user) {
          set({ 
            user: { ...user, ...updates } 
          });
        }
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'motofreela-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectUserRole = (state: AuthState) => state.user?.role;
export const selectIsMotoboy = (state: AuthState) => state.user?.role === 'motoboy';
export const selectIsCompany = (state: AuthState) => state.user?.role === 'company';
