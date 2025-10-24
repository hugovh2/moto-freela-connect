/**
 * Confirmar especificamente usuários motoboy
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function confirmMotoboyUsers() {
  try {
    console.log('🏍️  CONFIRMANDO USUÁRIOS MOTOBOY\n');
    
    // 1. Listar todos os usuários
    console.log('1. Listando todos os usuários...');
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar:', listError.message);
      return;
    }
    
    console.log(`   Total: ${users.length} usuários`);
    
    // 2. Verificar roles de cada usuário
    console.log('\n2. Verificando roles...');
    const motoboyUsers = [];
    
    for (const user of users) {
      // Verificar role na tabela user_roles
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData?.role === 'motoboy') {
        motoboyUsers.push(user);
        console.log(`   🏍️  ${user.email} - Motoboy`);
      } else if (roleData?.role === 'company') {
        console.log(`   🏢 ${user.email} - Empresa`);
      } else {
        console.log(`   ❓ ${user.email} - Sem role`);
      }
    }
    
    console.log(`\n   Total de motoboys: ${motoboyUsers.length}`);
    
    // 3. Confirmar motoboys não confirmados
    console.log('\n3. Confirmando motoboys...');
    let confirmedCount = 0;
    
    for (const user of motoboyUsers) {
      if (!user.email_confirmed_at) {
        try {
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
    
    console.log(`\n✅ Motoboys confirmados: ${confirmedCount}`);
    
    // 4. Verificar resultado final
    console.log('\n4. Verificação final...');
    const { data: { users: finalUsers } } = await supabaseAdmin.auth.admin.listUsers();
    
    let totalConfirmed = 0;
    let motoboyConfirmed = 0;
    
    for (const user of finalUsers) {
      if (user.email_confirmed_at) {
        totalConfirmed++;
        
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (roleData?.role === 'motoboy') {
          motoboyConfirmed++;
        }
      }
    }
    
    console.log(`   Total confirmados: ${totalConfirmed}/${finalUsers.length}`);
    console.log(`   Motoboys confirmados: ${motoboyConfirmed}/${motoboyUsers.length}`);
    
    if (motoboyConfirmed === motoboyUsers.length) {
      console.log('\n🎉 TODOS OS MOTOBOYS CONFIRMADOS!');
    } else {
      console.log('\n⚠️  Alguns motoboys ainda não confirmados');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

confirmMotoboyUsers();
