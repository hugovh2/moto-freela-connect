/**
 * Teste da versão RESETADA do Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY';

console.log('🧪 TESTE DE AUTENTICAÇÃO RESETADA\n');

// Cliente ULTRA básico
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

async function testResetAuth() {
  try {
    console.log('1. Testando conexão básica...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError);
      return;
    }
    console.log('✅ Conexão OK');

    console.log('\n2. Testando signup com email único...');
    const testEmail = `test-reset-${Date.now()}@test.com`;
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpass123',
      options: {
        data: {
          full_name: 'Test Reset User',
          role: 'company'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no signup:', signupError);
      console.error('   Status:', signupError.status);
      console.error('   Message:', signupError.message);
      
      // Se for erro de email, tentar com domínio diferente
      if (signupError.message.includes('email') || signupError.message.includes('invalid')) {
        console.log('\n3. Tentando com email simples...');
        const simpleEmail = `user${Date.now()}@gmail.com`;
        
        const { data: signup2Data, error: signup2Error } = await supabase.auth.signUp({
          email: simpleEmail,
          password: 'password123',
          options: {
            data: {
              full_name: 'Simple User',
              role: 'company'
            }
          }
        });
        
        if (signup2Error) {
          console.error('❌ Erro no signup simples:', signup2Error);
        } else {
          console.log('✅ Signup simples OK:', signup2Data.user?.email);
          
          // Testar login
          console.log('\n4. Testando login...');
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: simpleEmail,
            password: 'password123'
          });
          
          if (loginError) {
            console.error('❌ Erro no login:', loginError);
          } else {
            console.log('✅ Login OK:', loginData.user?.email);
            console.log('🔑 Token válido:', !!loginData.session?.access_token);
          }
        }
      }
    } else {
      console.log('✅ Signup OK:', signupData.user?.email);
    }

    console.log('\n5. Verificando configuração do projeto...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key preview:', SUPABASE_KEY.substring(0, 50) + '...');
    
    // Testar uma query simples
    console.log('\n6. Testando query simples...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .limit(3);
    
    if (profilesError) {
      console.error('❌ Erro na query:', profilesError);
    } else {
      console.log('✅ Query OK, profiles encontrados:', profilesData?.length || 0);
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testResetAuth();
