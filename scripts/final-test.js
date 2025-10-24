/**
 * Teste final após todas as correções
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rinszzwdteaytefdwwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY'
);

async function finalTest() {
  try {
    console.log('🎯 TESTE FINAL COMPLETO\n');
    
    // 1. Verificar status após correções
    console.log('1. Status dos usuários...');
    const { data: statusData } = await supabase.rpc('debug_auth_status');
    if (statusData?.[0]) {
      const stats = statusData[0];
      console.log(`   ✅ Total: ${stats.total_users}`);
      console.log(`   ✅ Confirmados: ${stats.confirmed_users}`);
      console.log(`   ❌ Não confirmados: ${stats.unconfirmed_users}`);
    }

    // 2. Listar emails disponíveis
    console.log('\n2. Emails disponíveis para teste...');
    const { data: usersData } = await supabase
      .from('profiles')
      .select('email, full_name')
      .limit(5);
    
    if (usersData && usersData.length > 0) {
      usersData.forEach(user => {
        console.log(`   📧 ${user.email} (${user.full_name})`);
      });
    } else {
      console.log('   ⚠️  Nenhum profile encontrado');
    }

    // 3. Teste de novo cadastro + login imediato
    console.log('\n3. Teste de novo usuário...');
    const testEmail = `final-${Date.now()}@gmail.com`;
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
      options: {
        data: {
          full_name: 'Final Test',
          role: 'company'
        }
      }
    });

    if (signupError) {
      console.error('❌ Signup:', signupError.message);
    } else {
      console.log('✅ Signup OK');
      
      // Login imediato
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'test123456'
      });

      if (loginError) {
        console.error('❌ Login:', loginError.message);
        
        if (loginError.message.includes('Email not confirmed')) {
          console.log('\n🚨 CONFIRMAÇÃO AINDA ATIVA!');
          console.log('Execute o SQL de confirmação e desabilite no painel');
        }
      } else {
        console.log('🎉 LOGIN IMEDIATO FUNCIONOU!');
        
        // 4. Teste criação de serviço
        console.log('\n4. Teste de criação de serviço...');
        const { error: serviceError } = await supabase
          .from('services')
          .insert({
            title: 'Teste Final Completo',
            description: 'Último teste',
            service_type: 'documentos',
            pickup_location: 'Origem',
            pickup_lat: -23.5505,
            pickup_lng: -46.6333,
            delivery_location: 'Destino',
            delivery_lat: -23.5506,
            delivery_lng: -46.6334,
            price: 50.00,
            company_id: loginData.user.id
          });
        
        if (serviceError) {
          console.error('❌ Erro serviço:', serviceError.message);
        } else {
          console.log('🎉🎉🎉 TUDO FUNCIONANDO PERFEITAMENTE! 🎉🎉🎉');
          console.log('✅ Signup, Login, Criação de Serviço - TUDO OK!');
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

finalTest();
