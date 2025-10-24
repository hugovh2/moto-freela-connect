/**
 * Centralized Error Handler
 * Provides consistent error handling and user-friendly messages in pt-BR
 */

import { toast } from 'sonner';

export interface AppError {
  code: string;
  message: string;
  originalError?: any;
  timestamp: Date;
}

/**
 * Error codes and their user-friendly messages in pt-BR
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication errors
  'auth/invalid-email': 'Email inválido. Por favor, verifique o endereço de email.',
  'auth/user-disabled': 'Esta conta foi desabilitada. Entre em contato com o suporte.',
  'auth/user-not-found': 'Usuário não encontrado. Verifique suas credenciais.',
  'auth/wrong-password': 'Senha incorreta. Tente novamente.',
  'auth/email-already-in-use': 'Este email já está em uso. Tente fazer login.',
  'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  'auth/invalid-credential': 'Credenciais inválidas. Verifique email e senha.',
  'auth/session-expired': 'Sessão expirada. Faça login novamente.',
  
  // Supabase specific errors
  'Invalid login credentials': 'Email ou senha incorretos.',
  'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
  'User already registered': 'Usuário já cadastrado. Tente fazer login.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  
  // Network errors
  'network-error': 'Erro de conexão. Verifique sua internet e tente novamente.',
  'timeout': 'A requisição demorou muito. Tente novamente.',
  'server-error': 'Erro no servidor. Tente novamente em alguns instantes.',
  
  // Database errors
  'db/permission-denied': 'Você não tem permissão para esta ação.',
  'db/not-found': 'Registro não encontrado.',
  'db/already-exists': 'Este registro já existe.',
  
  // Validation errors
  'validation/required-field': 'Este campo é obrigatório.',
  'validation/invalid-format': 'Formato inválido.',
  'validation/min-length': 'Valor muito curto.',
  'validation/max-length': 'Valor muito longo.',
  
  // Generic errors
  'unknown': 'Ocorreu um erro inesperado. Tente novamente.',
  'cancelled': 'Operação cancelada.',
};

/**
 * Maps error codes to user-friendly messages
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return ERROR_MESSAGES['unknown'];

  // Check for error message directly
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  // Check for error.message
  if (error.message) {
    const message = error.message as string;
    
    // Check if message matches known error
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(key) || message.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Return original message if it's user-friendly (not technical)
    if (!message.includes('Error:') && !message.includes('Exception') && message.length < 100) {
      return message;
    }
  }

  // Check for error.code
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }

  // Check for HTTP status codes
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Requisição inválida. Verifique os dados enviados.';
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Acesso negado. Você não tem permissão.';
      case 404:
        return 'Recurso não encontrado.';
      case 409:
        return 'Conflito. Este registro já existe.';
      case 422:
        return 'Dados inválidos. Verifique os campos.';
      case 429:
        return 'Muitas requisições. Aguarde um momento.';
      case 500:
        return 'Erro no servidor. Tente novamente mais tarde.';
      case 503:
        return 'Serviço temporariamente indisponível.';
      default:
        return `Erro ${error.status}. Tente novamente.`;
    }
  }

  return ERROR_MESSAGES['unknown'];
};

/**
 * Creates a standardized AppError object
 */
export const createAppError = (error: any, code: string = 'unknown'): AppError => {
  return {
    code,
    message: getErrorMessage(error),
    originalError: error,
    timestamp: new Date(),
  };
};

/**
 * Handles errors and shows user-friendly toast messages
 */
export const handleError = (
  error: any,
  options: {
    silent?: boolean;
    customMessage?: string;
    onError?: (appError: AppError) => void;
  } = {}
): AppError => {
  const appError = createAppError(error);

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error('[ErrorHandler]', {
      code: appError.code,
      message: appError.message,
      original: appError.originalError,
      timestamp: appError.timestamp,
    });
  }

  // Show toast notification unless silent
  if (!options.silent) {
    const message = options.customMessage || appError.message;
    toast.error(message, {
      duration: 5000,
      position: 'top-center',
    });
  }

  // Call custom error handler if provided
  if (options.onError) {
    options.onError(appError);
  }

  return appError;
};

/**
 * Handles authentication errors specifically
 */
export const handleAuthError = (error: any, context: string = 'auth'): AppError => {
  const appError = createAppError(error, `auth/${context}`);
  
  // Special handling for auth errors
  if (error?.message?.includes('Invalid login credentials')) {
    toast.error('Email ou senha incorretos. Tente novamente.', {
      duration: 5000,
    });
  } else if (error?.message?.includes('Email not confirmed')) {
    toast.error('Confirme seu email antes de fazer login.', {
      duration: 7000,
      description: 'Verifique sua caixa de entrada e spam.',
    });
  } else {
    toast.error(appError.message, {
      duration: 5000,
    });
  }

  return appError;
};

/**
 * Handles network errors
 */
export const handleNetworkError = (error: any): AppError => {
  const appError = createAppError(error, 'network-error');
  
  toast.error('Erro de conexão', {
    description: 'Verifique sua internet e tente novamente.',
    duration: 5000,
  });

  return appError;
};

/**
 * Wraps async functions with error handling
 */
export const withErrorHandler = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    errorMessage?: string;
    onError?: (error: AppError) => void;
  } = {}
): T => {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, {
        customMessage: options.errorMessage,
        onError: options.onError,
      });
      throw error;
    }
  }) as T;
};

/**
 * Validates required fields and returns error if missing
 */
export const validateRequired = (
  fields: Record<string, any>,
  fieldNames: Record<string, string>
): string | null => {
  for (const [key, label] of Object.entries(fieldNames)) {
    if (!fields[key] || (typeof fields[key] === 'string' && fields[key].trim() === '')) {
      return `${label} é obrigatório.`;
    }
  }
  return null;
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido.';
  }
  return null;
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): string | null => {
  if (password.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return null;
};
