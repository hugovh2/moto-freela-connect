/**
 * Script para testar autenticação e diagnosticar problemas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🔍 DIAGNÓSTICO DE AUTENTICAÇÃO\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  try {
    console.log('\n1. Testando conexão básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Erro na conexão:', healthError);
      return;
    }
    console.log('✅ Conexão OK');

    console.log('\n2. Verificando usuários existentes...');
    const { data: users, error: usersError } = await supabase
      .rpc('debug_auth_info');
    
    if (usersError) {
      console.log('⚠️  Função debug não disponível:', usersError.message);
    } else {
      console.log('👥 Usuários:', users);
    }

    console.log('\n3. Testando signup...');
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpass123',
      options: {
        data: {
          full_name: 'Test User',
          role: 'company'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no signup:', signupError);
    } else {
      console.log('✅ Signup OK:', signupData.user?.email);
      
      console.log('\n4. Testando login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'testpass123'
      });

      if (loginError) {
        console.error('❌ Erro no login:', loginError);
      } else {
        console.log('✅ Login OK:', loginData.user?.email);
        
        console.log('\n5. Verificando sessão...');
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('📋 Sessão:', sessionData.session ? 'Ativa' : 'Inativa');
        
        if (sessionData.session) {
          console.log('🔑 Access Token válido:', sessionData.session.access_token ? 'Sim' : 'Não');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testAuth();
