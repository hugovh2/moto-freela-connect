/**
 * Unit Tests for Error Handler
 */

import { describe, it, expect } from 'vitest';
import { 
  getErrorMessage, 
  validateRequired, 
  validateEmail, 
  validatePassword 
} from '../error-handler';

describe('getErrorMessage', () => {
  it('should return unknown error for null', () => {
    const message = getErrorMessage(null);
    expect(message).toContain('erro inesperado');
  });

  it('should map auth errors correctly', () => {
    const error = { code: 'auth/invalid-email' };
    const message = getErrorMessage(error);
    expect(message).toContain('Email inválido');
  });

  it('should handle string errors', () => {
    const message = getErrorMessage('Invalid login credentials');
    expect(message).toContain('Email ou senha incorretos');
  });

  it('should handle HTTP status codes', () => {
    const error = { status: 404 };
    const message = getErrorMessage(error);
    expect(message).toContain('não encontrado');
  });

  it('should return original message if user-friendly', () => {
    const error = { message: 'Operação cancelada' };
    const message = getErrorMessage(error);
    expect(message).toBe('Operação cancelada');
  });
});

describe('validateRequired', () => {
  it('should return null when all fields are present', () => {
    const fields = { email: 'test@test.com', password: '123456' };
    const fieldNames = { email: 'Email', password: 'Senha' };
    
    const error = validateRequired(fields, fieldNames);
    expect(error).toBeNull();
  });

  it('should return error for missing field', () => {
    const fields = { email: '', password: '123456' };
    const fieldNames = { email: 'Email', password: 'Senha' };
    
    const error = validateRequired(fields, fieldNames);
    expect(error).toContain('Email é obrigatório');
  });

  it('should return error for whitespace-only field', () => {
    const fields = { email: '   ', password: '123456' };
    const fieldNames = { email: 'Email', password: 'Senha' };
    
    const error = validateRequired(fields, fieldNames);
    expect(error).toContain('Email é obrigatório');
  });
});

describe('validateEmail', () => {
  it('should return null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name@domain.co.uk')).toBeNull();
  });

  it('should return error for invalid email', () => {
    expect(validateEmail('invalid')).toContain('Email inválido');
    expect(validateEmail('test@')).toContain('Email inválido');
    expect(validateEmail('@domain.com')).toContain('Email inválido');
    expect(validateEmail('test @domain.com')).toContain('Email inválido');
  });
});

describe('validatePassword', () => {
  it('should return null for valid password', () => {
    expect(validatePassword('123456')).toBeNull();
    expect(validatePassword('strongPassword123')).toBeNull();
  });

  it('should return error for short password', () => {
    expect(validatePassword('12345')).toContain('pelo menos 6 caracteres');
    expect(validatePassword('abc')).toContain('pelo menos 6 caracteres');
    expect(validatePassword('')).toContain('pelo menos 6 caracteres');
  });
});
