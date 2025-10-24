/**
 * Permissions Manager
 * Handles GPS/Location permissions with proper error handling and user feedback
 */

import { Geolocation } from '@capacitor/geolocation';
import { toast } from 'sonner';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';

export interface PermissionResult {
  granted: boolean;
  status: PermissionStatus;
  canRequest: boolean;
  message?: string;
}

/**
 * Check current location permission status
 */
export const checkLocationPermission = async (): Promise<PermissionResult> => {
  try {
    const result = await Geolocation.checkPermissions();
    const status = result.location as PermissionStatus;
    
    return {
      granted: status === 'granted',
      status,
      canRequest: status === 'prompt' || status === 'denied',
      message: getPermissionMessage(status)
    };
  } catch (error) {
    console.error('[PermissionsManager] Error checking location permission:', error);
    return {
      granted: false,
      status: 'unknown',
      canRequest: true,
      message: 'Erro ao verificar permissões de localização'
    };
  }
};

/**
 * Request location permission from user
 */
export const requestLocationPermission = async (): Promise<PermissionResult> => {
  try {
    // First check current status
    const currentStatus = await checkLocationPermission();
    
    // If already granted, return success
    if (currentStatus.granted) {
      return currentStatus;
    }
    
    // If permanently denied, guide user to settings
    if (currentStatus.status === 'denied' && !currentStatus.canRequest) {
      return {
        granted: false,
        status: 'denied',
        canRequest: false,
        message: 'Permissão negada. Habilite a localização nas configurações do dispositivo.'
      };
    }
    
    // Request permission
    const result = await Geolocation.requestPermissions();
    const status = result.location as PermissionStatus;
    
    return {
      granted: status === 'granted',
      status,
      canRequest: status !== 'denied',
      message: getPermissionMessage(status)
    };
  } catch (error) {
    console.error('[PermissionsManager] Error requesting location permission:', error);
    return {
      granted: false,
      status: 'denied',
      canRequest: false,
      message: 'Erro ao solicitar permissões de localização'
    };
  }
};

/**
 * Request location permission with user-friendly toast messages
 */
export const requestLocationPermissionWithFeedback = async (): Promise<boolean> => {
  const result = await requestLocationPermission();
  
  if (result.granted) {
    toast.success('Permissão de localização concedida!');
    return true;
  } else {
    if (result.status === 'denied' && !result.canRequest) {
      toast.error(
        'Permissão de localização negada. Habilite nas configurações do dispositivo.',
        { duration: 5000 }
      );
    } else {
      toast.error(
        'Precisamos da sua localização para iniciar como motoboy.',
        { duration: 4000 }
      );
    }
    return false;
  }
};

/**
 * Get user-friendly message for permission status
 */
const getPermissionMessage = (status: PermissionStatus): string => {
  switch (status) {
    case 'granted':
      return 'Permissão de localização concedida';
    case 'denied':
      return 'Permissão de localização negada. Habilite nas configurações.';
    case 'prompt':
      return 'Permissão de localização necessária';
    default:
      return 'Status de permissão desconhecido';
  }
};

/**
 * Check if location services are available
 */
export const isLocationAvailable = (): boolean => {
  return 'geolocation' in navigator || typeof Geolocation !== 'undefined';
};

/**
 * Get detailed permission status for debugging
 */
export const getDetailedPermissionStatus = async () => {
  try {
    const permission = await checkLocationPermission();
    const available = isLocationAvailable();
    
    return {
      available,
      permission,
      canUseLocation: available && permission.granted,
      needsRequest: available && !permission.granted && permission.canRequest,
      isPermanentlyDenied: permission.status === 'denied' && !permission.canRequest
    };
  } catch (error) {
    console.error('[PermissionsManager] Error getting detailed status:', error);
    return {
      available: false,
      permission: null,
      canUseLocation: false,
      needsRequest: false,
      isPermanentlyDenied: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Show settings guide for permanently denied permissions
 */
export const showSettingsGuide = () => {
  toast.error(
    'Para usar recursos de localização, habilite a permissão nas configurações do dispositivo:\n\n' +
    '1. Abra Configurações\n' +
    '2. Encontre MotoFreela\n' +
    '3. Habilite "Localização"',
    { duration: 8000 }
  );
};
