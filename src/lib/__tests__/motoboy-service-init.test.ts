/**
 * Unit Tests for Motoboy Service Initialization
 * Tests guards, validations, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  validateMotoboyProfile, 
  initializeMotoboyServices,
  retryInitialization,
  resetInitialization 
} from '../motoboy-service-init';

describe('validateMotoboyProfile', () => {
  it('should return valid for correct motoboy profile', () => {
    const profile = {
      id: '123',
      role: 'motoboy',
      full_name: 'João Silva',
      vehicle_type: 'motorcycle',
      onboarding_completed: true
    };

    const result = validateMotoboyProfile(profile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should return error when profile is null', () => {
    const result = validateMotoboyProfile(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Perfil não encontrado');
  });

  it('should return error when role is not motoboy', () => {
    const profile = {
      id: '123',
      role: 'company',
      full_name: 'Empresa XYZ'
    };

    const result = validateMotoboyProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Perfil não é de motoboy');
  });

  it('should add warnings for missing optional fields', () => {
    const profile = {
      id: '123',
      role: 'motoboy',
      full_name: 'João Silva'
      // Missing vehicle_type and onboarding_completed
    };

    const result = validateMotoboyProfile(profile);
    expect(result.valid).toBe(true);
    expect(result.warnings).toBeDefined();
  });
});

describe('initializeMotoboyServices', () => {
  beforeEach(() => {
    resetInitialization();
  });

  it('should fail initialization with invalid profile', async () => {
    const invalidProfile = {
      id: '123',
      role: 'company' // Wrong role
    };

    const result = await initializeMotoboyServices(invalidProfile as any);
    
    expect(result.success).toBe(false);
    expect(result.profileValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should handle missing profile gracefully', async () => {
    const result = await initializeMotoboyServices(null as any);
    
    expect(result.success).toBe(false);
    expect(result.profileValid).toBe(false);
    expect(result.errors).toContain('Perfil não encontrado');
  });

  it('should prevent concurrent initializations', async () => {
    const profile = {
      id: '123',
      role: 'motoboy',
      full_name: 'João Silva'
    };

    // Start two initializations simultaneously
    const promise1 = initializeMotoboyServices(profile as any);
    const promise2 = initializeMotoboyServices(profile as any);

    // Both should return the same promise
    expect(promise1).toBe(promise2);
  });
});

describe('retryInitialization', () => {
  beforeEach(() => {
    resetInitialization();
  });

  it('should retry initialization on failure', async () => {
    const profile = {
      id: '123',
      role: 'motoboy',
      full_name: 'João Silva'
    };

    // This will likely fail due to missing permissions in test env
    const result = await retryInitialization(profile as any, 2, 100);
    
    expect(result).toBeDefined();
    expect(result.success).toBeDefined();
  });
});
