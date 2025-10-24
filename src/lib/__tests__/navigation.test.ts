/**
 * Unit Tests for Safe Navigation Utilities
 */

import { describe, it, expect, vi } from 'vitest';
import { safeNavigate, isValidRoute, getDashboardRoute } from '../navigation';

describe('safeNavigate', () => {
  it('should return false when navigate is null', () => {
    const result = safeNavigate(null, '/test');
    expect(result).toBe(false);
  });

  it('should return false when navigate is undefined', () => {
    const result = safeNavigate(undefined, '/test');
    expect(result).toBe(false);
  });

  it('should return false when path is empty', () => {
    const mockNavigate = vi.fn();
    const result = safeNavigate(mockNavigate, '');
    expect(result).toBe(false);
  });

  it('should call navigate when valid', () => {
    const mockNavigate = vi.fn();
    const result = safeNavigate(mockNavigate, '/test');
    
    expect(result).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/test', expect.any(Object));
  });

  it('should handle navigation errors', () => {
    const mockNavigate = vi.fn(() => {
      throw new Error('Navigation failed');
    });
    
    const result = safeNavigate(mockNavigate, '/test');
    expect(result).toBe(false);
  });

  it('should call onError callback on failure', () => {
    const mockNavigate = vi.fn(() => {
      throw new Error('Navigation failed');
    });
    const onError = vi.fn();
    
    safeNavigate(mockNavigate, '/test', { onError });
    expect(onError).toHaveBeenCalled();
  });
});

describe('isValidRoute', () => {
  it('should return true for valid routes', () => {
    expect(isValidRoute('/')).toBe(true);
    expect(isValidRoute('/auth')).toBe(true);
    expect(isValidRoute('/company')).toBe(true);
    expect(isValidRoute('/motoboy')).toBe(true);
  });

  it('should return true for paths starting with /', () => {
    expect(isValidRoute('/custom-route')).toBe(true);
  });
});

describe('getDashboardRoute', () => {
  it('should return /company for company role', () => {
    expect(getDashboardRoute('company')).toBe('/company');
  });

  it('should return /motoboy for motoboy role', () => {
    expect(getDashboardRoute('motoboy')).toBe('/motoboy');
  });

  it('should return /auth for null role', () => {
    expect(getDashboardRoute(null)).toBe('/auth');
  });

  it('should return /auth for undefined role', () => {
    expect(getDashboardRoute(undefined)).toBe('/auth');
  });

  it('should return /auth for unknown role', () => {
    expect(getDashboardRoute('unknown')).toBe('/auth');
  });
});
