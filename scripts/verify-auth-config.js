/**
 * Script para verificar se a configuração de autenticação foi aplicada
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rinszzwdteaytefdwwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY'
);

async function verifyAuthConfig() {
  try {
    console.log('🔍 VERIFICANDO CONFIGURAÇÃO DE AUTENTICAÇÃO\n');
    
    // 1. Testar signup + login imediato
    console.log('1. Testando signup + login imediato...');
    const testEmail = `verify-${Date.now()}@test.com`;
    const testPassword = 'test123456';
    
    console.log(`   Criando usuário: ${testEmail}`);
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Verify User',
          role: 'company'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no signup:', signupError.message);
      return;
    }

    console.log('✅ Signup OK');
    
    // 2. Tentar login imediatamente (vai falhar se confirmação estiver ativa)
    console.log('2. Testando login imediato...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      if (loginError.message.includes('Email not confirmed')) {
        console.log('❌ CONFIRMAÇÃO DE EMAIL AINDA ESTÁ ATIVA');
        console.log('\n🔧 SOLUÇÃO:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc');
        console.log('2. Vá em: Authentication → Settings');
        console.log('3. Procure por: "Enable email confirmations"');
        console.log('4. DESMARQUE essa opção');
        console.log('5. Clique em: Save');
        console.log('\n⚠️  Esta é a ÚNICA forma confiável de desabilitar confirmação!');
      } else {
        console.error('❌ Outro erro no login:', loginError.message);
      }
    } else {
      console.log('🎉 LOGIN IMEDIATO FUNCIONOU!');
      console.log('✅ Confirmação de email está DESABILITADA');
      console.log('✅ Email:', loginData.user?.email);
      console.log('✅ Token válido:', !!loginData.session?.access_token);
      
      // 3. Testar criação de serviço
      console.log('\n3. Testando criação de serviço...');
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .insert({
          title: 'Teste de Serviço',
          description: 'Serviço de teste',
          service_type: 'documentos',
          pickup_location: 'Local A',
          pickup_lat: -23.5505,
          pickup_lng: -46.6333,
          delivery_location: 'Local B', 
          delivery_lat: -23.5506,
          delivery_lng: -46.6334,
          price: 25.00,
          company_id: loginData.user.id
        });
      
      if (serviceError) {
        console.error('❌ Erro ao criar serviço:', serviceError.message);
      } else {
        console.log('🎉 SERVIÇO CRIADO COM SUCESSO!');
        console.log('✅ Política RLS funcionando corretamente');
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

verifyAuthConfig();
