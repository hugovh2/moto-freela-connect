/**
 * Confirmar usuários via Service Role (Acesso Administrativo)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

// Cliente com permissões administrativas
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmAllUsers() {
  try {
    console.log('🔧 CONFIRMANDO USUÁRIOS VIA API ADMINISTRATIVA\n');
    
    // 1. Listar todos os usuários
    console.log('1. Buscando usuários...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar:', listError.message);
      return;
    }
    
    console.log(`   Encontrados: ${users.length} usuários`);
    
    // 2. Confirmar cada usuário
    console.log('\n2. Confirmando usuários...');
    let confirmedCount = 0;
    
    for (const user of users) {
      if (!user.email_confirmed_at) {
        try {
          // Atualizar usuário com email confirmado
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
          );
          
          if (updateError) {
            console.log(`   ⚠️  ${user.email}: ${updateError.message}`);
          } else {
            console.log(`   ✅ ${user.email}: Confirmado`);
            confirmedCount++;
          }
        } catch (err) {
          console.log(`   ⚠️  ${user.email}: Erro ao confirmar`);
        }
      } else {
        console.log(`   ✓  ${user.email}: Já confirmado`);
      }
    }
    
    console.log(`\n✅ Confirmados: ${confirmedCount} de ${users.length}`);
    
    // 3. Verificar resultado
    console.log('\n3. Verificando resultado...');
    const { data: { users: updatedUsers } } = await supabaseAdmin.auth.admin.listUsers();
    
    const confirmedUsers = updatedUsers.filter(u => u.email_confirmed_at);
    const unconfirmedUsers = updatedUsers.filter(u => !u.email_confirmed_at);
    
    console.log(`   Total: ${updatedUsers.length}`);
    console.log(`   Confirmados: ${confirmedUsers.length}`);
    console.log(`   Não confirmados: ${unconfirmedUsers.length}`);
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n⚠️  Usuários ainda não confirmados:');
      unconfirmedUsers.forEach(u => console.log(`   - ${u.email}`));
    } else {
      console.log('\n🎉 TODOS OS USUÁRIOS CONFIRMADOS!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

confirmAllUsers();
