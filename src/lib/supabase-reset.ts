/**
 * Cliente Supabase RESETADO - Para limpar todos os problemas de JWT
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY';

// RESETAR COMPLETAMENTE O ARMAZENAMENTO LOCAL
export const clearAllAuth = () => {
  try {
    // Limpar localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
    
    // Limpar sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Armazenamento local limpo completamente');
  } catch (error) {
    console.error('Erro ao limpar storage:', error);
  }
};

// Cliente Supabase ULTRA BÁSICO
export const supabaseReset = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    // Configuração mínima
    persistSession: false, // NÃO persistir sessão para evitar JWT corrompido
    autoRefreshToken: false, // NÃO auto-refresh para evitar loops
    detectSessionInUrl: false, // NÃO detectar na URL
    
    // Storage customizado que SEMPRE limpa
    storage: {
      getItem: () => null, // SEMPRE retorna null
      setItem: () => {}, // NÃO salva nada
      removeItem: () => {}, // NÃO faz nada
    },
  },
});

// Função de signup LIMPA
export const cleanSignUp = async (email: string, password: string, fullName: string, role: 'company' | 'motoboy') => {
  try {
    // LIMPAR TUDO ANTES
    clearAllAuth();
    
    console.log('🚀 Fazendo signup LIMPO:', { email, fullName, role });
    
    const { data, error } = await supabaseReset.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      console.error('❌ Erro no signup:', error);
      return { data: null, error };
    }

    console.log('✅ Signup LIMPO OK:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exceção no signup:', error);
    return { data: null, error };
  }
};

// Função de login LIMPA
export const cleanSignIn = async (email: string, password: string) => {
  try {
    // LIMPAR TUDO ANTES
    clearAllAuth();
    
    console.log('🚀 Fazendo login LIMPO:', email);
    
    const { data, error } = await supabaseReset.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Erro no login:', error);
      return { data: null, error };
    }

    console.log('✅ Login LIMPO OK:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exceção no login:', error);
    return { data: null, error };
  }
};

// Função para testar conectividade
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão básica...');
    
    const { data, error } = await supabaseReset
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão OK');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
};
