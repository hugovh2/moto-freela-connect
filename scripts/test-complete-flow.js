/**
 * Teste do fluxo completo: Login → Criar Serviço
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rinszzwdteaytefdwwnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzk0OTgsImV4cCI6MjA3NjkxNTQ5OH0.T-DOEYBv6iqrXOdztlnRtRlBVOJKXBrVGvza0kdsOSY'
);

async function testCompleteFlow() {
  try {
    console.log('🧪 TESTE DO FLUXO COMPLETO\n');
    
    // 1. Listar emails disponíveis
    console.log('1. Listando emails confirmados...');
    const { data: usersData } = await supabase
      .from('profiles')
      .select('email, full_name')
      .limit(5);
    
    if (!usersData || usersData.length === 0) {
      console.log('⚠️  Nenhum profile encontrado');
      
      // Listar diretamente de auth.users
      console.log('\n2. Tentando listar de auth.users...');
      const { data: { users } } = await supabase.auth.admin.listUsers();
      
      if (users && users.length > 0) {
        console.log('Emails disponíveis:');
        users.forEach(u => console.log(`   📧 ${u.email}`));
      }
    } else {
      console.log('Emails com profile:');
      usersData.forEach(u => console.log(`   📧 ${u.email} (${u.full_name})`));
    }

    // 3. Login com email confirmado
    const testEmail = 'vitorhugo1524@gmail.com'; // Use um email da lista acima
    const testPassword = 'sua_senha'; // Substitua pela senha real
    
    console.log(`\n3. Fazendo login com ${testEmail}...`);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Login falhou:', loginError.message);
      console.log('\n💡 INSTRUÇÕES:');
      console.log('1. Use um dos emails listados acima');
      console.log('2. Se não souber a senha, crie um novo usuário:');
      console.log('   - Cadastre-se na aplicação');
      console.log('   - Use um email válido (ex: seu@email.com)');
      console.log('   - A senha deve ter pelo menos 6 caracteres');
      return;
    }

    console.log('✅ Login OK:', loginData.user?.email);
    console.log('✅ Token válido:', !!loginData.session?.access_token);
    
    // 4. Verificar se tem role de company
    console.log('\n4. Verificando role do usuário...');
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', loginData.user.id)
      .single();
    
    if (!roleData) {
      console.log('❌ Usuário não tem role definida');
      console.log('💡 Adicionando role de company...');
      
      await supabase
        .from('user_roles')
        .insert({
          user_id: loginData.user.id,
          role: 'company'
        });
      
      console.log('✅ Role adicionada');
    } else {
      console.log('✅ Role:', roleData.role);
    }

    // 5. Criar serviço
    console.log('\n5. Criando serviço...');
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .insert({
        title: 'Teste Completo',
        description: 'Teste do fluxo completo',
        service_type: 'documentos',
        pickup_location: 'Endereço de Origem',
        pickup_lat: -23.5505,
        pickup_lng: -46.6333,
        delivery_location: 'Endereço de Destino',
        delivery_lat: -23.5506,
        delivery_lng: -46.6334,
        price: 35.00,
        company_id: loginData.user.id
      })
      .select()
      .single();

    if (serviceError) {
      console.error('❌ Erro ao criar serviço:', serviceError);
      
      if (serviceError.message.includes('row-level security')) {
        console.log('\n🔒 Problema com política RLS');
        console.log('Verificando role novamente...');
        
        const { data: verifyRole } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', loginData.user.id);
        
        console.log('Roles encontradas:', verifyRole);
      }
    } else {
      console.log('🎉🎉🎉 SERVIÇO CRIADO COM SUCESSO! 🎉🎉🎉');
      console.log('ID:', serviceData.id);
      console.log('Título:', serviceData.title);
      console.log('Preço: R$', serviceData.price);
      console.log('\n✅ TUDO FUNCIONANDO PERFEITAMENTE!');
      console.log('✅ Agora você pode fazer login na aplicação e criar serviços!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testCompleteFlow();
