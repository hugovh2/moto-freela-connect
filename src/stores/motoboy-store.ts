/**
 * Motoboy Store - Zustand
 * Gerenciamento de estado específico para motoboys
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface MotoboyStats {
  totalEarnings: number;
  todayEarnings: number;
  totalRides: number;
  averageRating: number;
  completionRate: number;
  badges: string[];
  level: number;
  experience: number;
}

export interface MotoboyLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface MotoboyState {
  // State
  isAvailable: boolean;
  isOnline: boolean;
  currentLocation: MotoboyLocation | null;
  stats: MotoboyStats;
  permissionsGranted: boolean;
  servicesInitialized: boolean;
  
  // Actions
  setAvailable: (available: boolean) => void;
  setOnline: (online: boolean) => void;
  setLocation: (location: MotoboyLocation) => void;
  updateStats: (stats: Partial<MotoboyStats>) => void;
  setPermissions: (granted: boolean) => void;
  setServicesInitialized: (initialized: boolean) => void;
  addBadge: (badge: string) => void;
  addExperience: (xp: number) => void;
  reset: () => void;
}

const initialStats: MotoboyStats = {
  totalEarnings: 0,
  todayEarnings: 0,
  totalRides: 0,
  averageRating: 0,
  completionRate: 0,
  badges: [],
  level: 1,
  experience: 0,
};

const initialState = {
  isAvailable: false,
  isOnline: false,
  currentLocation: null,
  stats: initialStats,
  permissionsGranted: false,
  servicesInitialized: false,
};

export const useMotoboyStore = create<MotoboyState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAvailable: (available) => {
        set({ isAvailable: available });
      },

      setOnline: (online) => {
        set({ isOnline: online });
      },

      setLocation: (location) => {
        set({ currentLocation: location });
      },

      updateStats: (statsUpdate) => {
        const { stats } = get();
        set({ 
          stats: { ...stats, ...statsUpdate } 
        });
      },

      setPermissions: (granted) => {
        set({ permissionsGranted: granted });
      },

      setServicesInitialized: (initialized) => {
        set({ servicesInitialized: initialized });
      },

      addBadge: (badge) => {
        const { stats } = get();
        if (!stats.badges.includes(badge)) {
          set({ 
            stats: { 
              ...stats, 
              badges: [...stats.badges, badge] 
            } 
          });
        }
      },

      addExperience: (xp) => {
        const { stats } = get();
        const newXP = stats.experience + xp;
        const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP por nível
        
        set({ 
          stats: { 
            ...stats, 
            experience: newXP,
            level: newLevel
          } 
        });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'motofreela-motoboy',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        stats: state.stats,
        isAvailable: state.isAvailable,
      }),
    }
  )
);

// Selectors
export const selectIsAvailable = (state: MotoboyState) => state.isAvailable;
export const selectIsOnline = (state: MotoboyState) => state.isOnline;
export const selectCurrentLocation = (state: MotoboyState) => state.currentLocation;
export const selectStats = (state: MotoboyState) => state.stats;
export const selectBadges = (state: MotoboyState) => state.stats.badges;
export const selectLevel = (state: MotoboyState) => state.stats.level;
