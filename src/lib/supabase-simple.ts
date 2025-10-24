/**
 * Cliente Supabase Simplificado - Para testar se o problema é com a configuração complexa
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validar variáveis de ambiente
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas!');
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL ? '✓ OK' : '✗ FALTANDO');
  console.error('VITE_SUPABASE_PUBLISHABLE_KEY:', SUPABASE_PUBLISHABLE_KEY ? '✓ OK' : '✗ FALTANDO');
  throw new Error('Variáveis de ambiente do Supabase não configuradas');
}

// Cliente simplificado sem configurações complexas
export const supabaseSimple = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Função de teste para verificar conectividade
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key preview:', SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
    
    const { data, error } = await supabaseSimple.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão OK, dados:', data);
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
};

// Função de signup simplificada
export const simpleSignUp = async (email: string, password: string, fullName: string, role: 'company' | 'motoboy') => {
  try {
    console.log('🔐 Fazendo signup com:', { email, fullName, role });
    
    const { data, error } = await supabaseSimple.auth.signUp({
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

    console.log('✅ Signup OK:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exceção no signup:', error);
    return { data: null, error };
  }
};

// Função de login simplificada
export const simpleSignIn = async (email: string, password: string) => {
  try {
    console.log('🔐 Fazendo login com:', email);
    
    const { data, error } = await supabaseSimple.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Erro no login:', error);
      return { data: null, error };
    }

    console.log('✅ Login OK:', data);
    return { data, error: null };
  } catch (error) {
    console.error('❌ Exceção no login:', error);
    return { data: null, error };
  }
};
