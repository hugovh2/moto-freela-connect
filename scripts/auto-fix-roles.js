/**
 * Adicionar roles automaticamente (motoboy por padrão)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function autoFixRoles() {
  try {
    console.log('🔧 CORRIGINDO ROLES AUTOMATICAMENTE\n');
    
    // 1. Listar todos os usuários
    console.log('1. Listando usuários...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    console.log(`   Total: ${users.length} usuários\n`);
    
    // 2. Verificar e adicionar roles
    console.log('2. Verificando e adicionando roles...\n');
    let added = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Verificar se já tem role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData) {
        console.log(`   ✓  ${user.email} - ${roleData.role} (já existe)`);
        skipped++;
      } else {
        // Adicionar role de motoboy por padrão
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'motoboy' // Padrão
          });
        
        if (error) {
          console.log(`   ❌ ${user.email} - Erro: ${error.message}`);
        } else {
          console.log(`   ✅ ${user.email} - motoboy (adicionado)`);
          added++;
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Roles adicionadas: ${added}`);
    console.log(`   Já existentes: ${skipped}`);
    
    // 3. Confirmar todos os emails
    console.log('\n3. Confirmando emails...\n');
    let confirmed = 0;
    
    for (const user of users) {
      if (!user.email_confirmed_at) {
        const { error } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (!error) {
          console.log(`   ✅ ${user.email} - confirmado`);
          confirmed++;
        }
      }
    }
    
    console.log(`\n   Emails confirmados: ${confirmed}`);
    
    // 4. Resumo final
    console.log('\n4. Estado final do sistema:\n');
    
    let companyCount = 0;
    let motoboyCount = 0;
    let noRoleCount = 0;
    
    for (const user of users) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (roleData?.role === 'company') {
        companyCount++;
        console.log(`   🏢 ${user.email} - Empresa`);
      } else if (roleData?.role === 'motoboy') {
        motoboyCount++;
        console.log(`   🏍️  ${user.email} - Motoboy`);
      } else {
        noRoleCount++;
        console.log(`   ❓ ${user.email} - SEM ROLE`);
      }
    }
    
    console.log(`\n✅ Sistema configurado:`);
    console.log(`   🏢 Empresas: ${companyCount}`);
    console.log(`   🏍️  Motoboys: ${motoboyCount}`);
    console.log(`   ❓ Sem role: ${noRoleCount}`);
    
    if (noRoleCount === 0) {
      console.log('\n🎉 TODOS OS USUÁRIOS TÊM ROLES!');
      console.log('✅ Agora você pode fazer login como motoboy ou empresa!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

autoFixRoles();
