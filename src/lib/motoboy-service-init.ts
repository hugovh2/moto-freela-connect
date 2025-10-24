/**
 * Motoboy Service Initialization
 * Safe initialization of motoboy-specific services with circuit breaker pattern
 */

import { checkLocationPermission, requestLocationPermissionWithFeedback } from './permissions-manager';
import { handleError } from './error-handler';
import { toast } from 'sonner';

export interface MotoboyProfile {
  id: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
  vehicle_type?: string;
  onboarding_completed?: boolean;
  is_available?: boolean;
}

export interface ServiceInitResult {
  success: boolean;
  permissionsGranted: boolean;
  profileValid: boolean;
  servicesReady: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Single-flight lock to prevent concurrent initializations
 */
let isInitializing = false;
let initializationPromise: Promise<ServiceInitResult> | null = null;

/**
 * Validate motoboy profile has required fields
 */
export const validateMotoboyProfile = (profile: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!profile) {
    errors.push('Perfil não encontrado');
    return { valid: false, errors };
  }
  
  if (profile.role !== 'motoboy') {
    errors.push('Perfil não é de motoboy');
    return { valid: false, errors };
  }
  
  // Optional validations (warnings, not errors)
  const warnings: string[] = [];
  if (!profile.vehicle_type) {
    warnings.push('Tipo de veículo não definido');
  }
  
  if (!profile.onboarding_completed) {
    warnings.push('Onboarding não completado');
  }
  
  return { valid: true, errors, warnings };
};

/**
 * Initialize motoboy services safely
 * Uses circuit breaker pattern to prevent crashes
 */
export const initializeMotoboyServices = async (
  profile: MotoboyProfile
): Promise<ServiceInitResult> => {
  // Single-flight pattern: prevent concurrent initializations
  if (isInitializing && initializationPromise) {
    console.log('[MotoboyServiceInit] Already initializing, returning existing promise');
    return initializationPromise;
  }
  
  isInitializing = true;
  
  initializationPromise = (async () => {
    const result: ServiceInitResult = {
      success: false,
      permissionsGranted: false,
      profileValid: false,
      servicesReady: false,
      errors: [],
      warnings: []
    };
    
    try {
      console.log('[MotoboyServiceInit] Starting initialization for:', profile.id);
      
      // Step 1: Validate profile
      const profileValidation = validateMotoboyProfile(profile);
      result.profileValid = profileValidation.valid;
      
      if (!profileValidation.valid) {
        result.errors.push(...profileValidation.errors);
        toast.error('Perfil de motoboy inválido');
        return result;
      }
      
      if (profileValidation.warnings) {
        result.warnings.push(...(profileValidation.warnings || []));
      }
      
      // Step 2: Check location permissions
      console.log('[MotoboyServiceInit] Checking location permissions...');
      const permissionStatus = await checkLocationPermission();
      result.permissionsGranted = permissionStatus.granted;
      
      if (!permissionStatus.granted) {
        console.log('[MotoboyServiceInit] Location permission not granted, requesting...');
        
        // Request permission with user feedback
        const granted = await requestLocationPermissionWithFeedback();
        result.permissionsGranted = granted;
        
        if (!granted) {
          result.warnings.push('Permissão de localização não concedida');
          // Don't fail completely - some features can work without location
        }
      }
      
      // Step 3: Initialize location tracking (if permissions granted)
      if (result.permissionsGranted) {
        console.log('[MotoboyServiceInit] Permissions granted, services can be initialized');
        result.servicesReady = true;
      } else {
        console.log('[MotoboyServiceInit] Limited mode - location services unavailable');
        result.servicesReady = false;
        result.warnings.push('Modo limitado: recursos de localização indisponíveis');
      }
      
      // Step 4: Mark as successful if profile is valid
      // (even if permissions are denied, we can still show the dashboard)
      result.success = result.profileValid;
      
      console.log('[MotoboyServiceInit] Initialization complete:', result);
      
      return result;
      
    } catch (error) {
      console.error('[MotoboyServiceInit] Initialization failed:', error);
      handleError(error, { customMessage: 'Erro ao inicializar serviços de motoboy' });
      
      result.errors.push(error instanceof Error ? error.message : 'Erro desconhecido');
      result.success = false;
      
      return result;
      
    } finally {
      isInitializing = false;
      // Clear promise after a delay to allow retry
      setTimeout(() => {
        initializationPromise = null;
      }, 5000);
    }
  })();
  
  return initializationPromise;
};

/**
 * Retry initialization with exponential backoff
 */
export const retryInitialization = async (
  profile: MotoboyProfile,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ServiceInitResult> => {
  let lastResult: ServiceInitResult | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    console.log(`[MotoboyServiceInit] Retry attempt ${attempt + 1}/${maxRetries}`);
    
    lastResult = await initializeMotoboyServices(profile);
    
    if (lastResult.success) {
      return lastResult;
    }
    
    // Wait before retry with exponential backoff
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`[MotoboyServiceInit] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed
  toast.error('Erro ao inicializar serviços. Tente novamente mais tarde.');
  return lastResult || {
    success: false,
    permissionsGranted: false,
    profileValid: false,
    servicesReady: false,
    errors: ['Todas as tentativas falharam'],
    warnings: []
  };
};

/**
 * Reset initialization state (for testing or manual retry)
 */
export const resetInitialization = () => {
  isInitializing = false;
  initializationPromise = null;
  console.log('[MotoboyServiceInit] Initialization state reset');
};

/**
 * Check if services are currently initializing
 */
export const isServiceInitializing = (): boolean => {
  return isInitializing;
};
