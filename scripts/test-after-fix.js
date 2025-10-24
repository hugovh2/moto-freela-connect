/**
 * Teste após corrigir confirmação de email
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rinszzwdteaytefdwwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY'
);

async function testAfterFix() {
  try {
    console.log('🧪 TESTE APÓS CORREÇÃO\n');
    
    // Tentar login com usuário que foi criado no teste anterior
    console.log('1. Tentando login com usuário do teste...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'user1761343488598@gmail.com',
      password: 'password123'
    });

    if (loginError) {
      console.error('❌ Ainda com erro:', loginError.message);
      
      // Tentar criar e logar imediatamente
      console.log('\n2. Criando novo usuário...');
      const newEmail = `test-${Date.now()}@gmail.com`;
      
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: newEmail,
        password: 'test123456',
        options: {
          data: {
            full_name: 'Test User',
            role: 'company'
          }
        }
      });
      
      if (signupError) {
        console.error('❌ Erro no signup:', signupError.message);
      } else {
        console.log('✅ Signup OK, tentando login...');
        
        const { data: immediateLogin, error: immediateError } = await supabase.auth.signInWithPassword({
          email: newEmail,
          password: 'test123456'
        });
        
        if (immediateError) {
          console.error('❌ Login imediato falhou:', immediateError.message);
        } else {
          console.log('🎉 LOGIN FUNCIONOU!');
          console.log('✅ Email:', immediateLogin.user?.email);
          console.log('✅ Token válido:', !!immediateLogin.session?.access_token);
        }
      }
    } else {
      console.log('🎉 LOGIN FUNCIONOU!');
      console.log('✅ Email:', loginData.user?.email);
      console.log('✅ Token válido:', !!loginData.session?.access_token);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testAfterFix();
