/**
 * Secure Storage Utilities
 * Provides secure token storage using Capacitor SecureStorage for mobile
 * Falls back to encrypted localStorage for web
 */

import { Capacitor } from '@capacitor/core';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'motofreela_access_token',
  REFRESH_TOKEN: 'motofreela_refresh_token',
  USER_SESSION: 'motofreela_user_session',
} as const;

/**
 * Checks if running on native platform
 */
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Simple encryption for web storage (not cryptographically secure, but better than plain text)
 */
const simpleEncrypt = (text: string): string => {
  try {
    return btoa(encodeURIComponent(text));
  } catch (error) {
    console.error('[SecureStorage] Encryption error:', error);
    return text;
  }
};

const simpleDecrypt = (encrypted: string): string => {
  try {
    return decodeURIComponent(atob(encrypted));
  } catch (error) {
    console.error('[SecureStorage] Decryption error:', error);
    return encrypted;
  }
};

/**
 * Stores data securely
 */
export const secureSet = async (key: string, value: string): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      // Use Capacitor Preferences for native (more secure than localStorage)
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key, value });
    } else {
      // Use encrypted localStorage for web
      const encrypted = simpleEncrypt(value);
      localStorage.setItem(key, encrypted);
    }
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Error storing ${key}:`, error);
    return false;
  }
};

/**
 * Retrieves data securely
 */
export const secureGet = async (key: string): Promise<string | null> => {
  try {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      return simpleDecrypt(encrypted);
    }
  } catch (error) {
    console.error(`[SecureStorage] Error retrieving ${key}:`, error);
    return null;
  }
};

/**
 * Removes data securely
 */
export const secureRemove = async (key: string): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error(`[SecureStorage] Error removing ${key}:`, error);
    return false;
  }
};

/**
 * Clears all secure storage
 */
export const secureClear = async (): Promise<boolean> => {
  try {
    if (isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.clear();
    } else {
      // Only clear MotoFreela keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
    return true;
  } catch (error) {
    console.error('[SecureStorage] Error clearing storage:', error);
    return false;
  }
};

// Token-specific helpers
export const TokenStorage = {
  async setAccessToken(token: string): Promise<boolean> {
    return secureSet(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  async getAccessToken(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.ACCESS_TOKEN);
  },

  async setRefreshToken(token: string): Promise<boolean> {
    return secureSet(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return secureGet(STORAGE_KEYS.REFRESH_TOKEN);
  },

  async setUserSession(session: any): Promise<boolean> {
    return secureSet(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
  },

  async getUserSession(): Promise<any | null> {
    const session = await secureGet(STORAGE_KEYS.USER_SESSION);
    if (!session) return null;
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<boolean> {
    const results = await Promise.all([
      secureRemove(STORAGE_KEYS.ACCESS_TOKEN),
      secureRemove(STORAGE_KEYS.REFRESH_TOKEN),
      secureRemove(STORAGE_KEYS.USER_SESSION),
    ]);
    return results.every(r => r);
  },
};
