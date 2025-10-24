/**
 * Teste após confirmar todos os usuários
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rinszzwdteaytefdwwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY'
);

async function testAfterConfirm() {
  try {
    console.log('🧪 TESTE APÓS CONFIRMAR USUÁRIOS\n');
    
    // 1. Verificar status de confirmação
    console.log('1. Verificando status de confirmação...');
    const { data: statusData, error: statusError } = await supabase
      .rpc('debug_auth_status');
    
    if (!statusError && statusData?.[0]) {
      const stats = statusData[0];
      console.log(`   Total: ${stats.total_users} usuários`);
      console.log(`   Confirmados: ${stats.confirmed_users}`);
      console.log(`   Não confirmados: ${stats.unconfirmed_users}`);
      
      if (stats.confirmed_users > 0) {
        console.log('✅ Alguns usuários foram confirmados!');
      } else {
        console.log('❌ Nenhum usuário confirmado ainda');
      }
    }

    // 2. Tentar login com seu email
    console.log('\n2. Tentando login com vitorhugo1524@gmail.com...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'vitorhugo1524@gmail.com',
      password: 'sua_senha_aqui' // Substitua pela senha real
    });

    if (loginError) {
      console.error('❌ Login falhou:', loginError.message);
      
      // Se falhar, tentar com outros emails
      console.log('\n3. Buscando emails disponíveis...');
      const { data: emailsData, error: emailsError } = await supabase
        .from('profiles')
        .select('email')
        .limit(5);
      
      if (!emailsError && emailsData) {
        console.log('Emails encontrados:', emailsData.map(p => p.email));
        console.log('\n💡 Tente fazer login com um desses emails na aplicação');
      }
    } else {
      console.log('🎉 LOGIN FUNCIONOU!');
      console.log('✅ Email:', loginData.user?.email);
      console.log('✅ Token válido:', !!loginData.session?.access_token);
      
      // 4. Testar criação de serviço
      console.log('\n4. Testando criação de serviço...');
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .insert({
          title: 'Teste Final',
          description: 'Teste após confirmação',
          service_type: 'documentos',
          pickup_location: 'Local A',
          pickup_lat: -23.5505,
          pickup_lng: -46.6333,
          delivery_location: 'Local B',
          delivery_lat: -23.5506,
          delivery_lng: -46.6334,
          price: 30.00,
          company_id: loginData.user.id
        });
      
      if (serviceError) {
        console.error('❌ Erro ao criar serviço:', serviceError.message);
      } else {
        console.log('🎉 SERVIÇO CRIADO COM SUCESSO!');
        console.log('✅ TUDO FUNCIONANDO PERFEITAMENTE!');
      }
    }

    // 5. Criar novo usuário para testar se confirmação foi desabilitada
    console.log('\n5. Testando novo cadastro...');
    const newEmail = `final-test-${Date.now()}@gmail.com`;
    
    const { data: newSignup, error: newSignupError } = await supabase.auth.signUp({
      email: newEmail,
      password: 'test123456',
      options: {
        data: {
          full_name: 'Final Test User',
          role: 'company'
        }
      }
    });

    if (newSignupError) {
      console.error('❌ Erro no novo signup:', newSignupError.message);
    } else {
      console.log('✅ Novo signup OK, testando login imediato...');
      
      const { data: immediateLogin, error: immediateError } = await supabase.auth.signInWithPassword({
        email: newEmail,
        password: 'test123456'
      });
      
      if (immediateError) {
        if (immediateError.message.includes('Email not confirmed')) {
          console.log('❌ Confirmação ainda obrigatória para novos usuários');
          console.log('💡 Desabilite no painel: Authentication → Settings');
        } else {
          console.error('❌ Outro erro:', immediateError.message);
        }
      } else {
        console.log('🎉 LOGIN IMEDIATO FUNCIONOU!');
        console.log('✅ Confirmação foi desabilitada com sucesso!');
      }
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

testAfterConfirm();
