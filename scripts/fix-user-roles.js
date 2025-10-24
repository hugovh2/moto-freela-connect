/**
 * Adicionar roles aos usuários que não têm
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixUserRoles() {
  try {
    console.log('🔧 CORRIGINDO ROLES DE USUÁRIOS\n');
    
    // 1. Listar usuários sem role
    console.log('1. Buscando usuários sem role...\n');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    
    const usersWithoutRole = [];
    
    for (const user of users) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!roleData) {
        usersWithoutRole.push(user);
        console.log(`   ❓ ${user.email} - SEM ROLE`);
      }
    }
    
    if (usersWithoutRole.length === 0) {
      console.log('✅ Todos os usuários já têm roles!');
      rl.close();
      return;
    }
    
    console.log(`\n   Total sem role: ${usersWithoutRole.length}`);
    
    // 2. Adicionar roles
    console.log('\n2. Adicionando roles...\n');
    
    for (const user of usersWithoutRole) {
      // Perguntar qual role para cada usuário
      console.log(`\nUsuário: ${user.email}`);
      const role = await question('Role (company/motoboy) [motoboy]: ');
      
      const selectedRole = role.trim().toLowerCase() || 'motoboy';
      
      if (selectedRole !== 'company' && selectedRole !== 'motoboy') {
        console.log('   ⚠️  Role inválida, usando "motoboy"');
      }
      
      const finalRole = (selectedRole === 'company') ? 'company' : 'motoboy';
      
      // Inserir role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: finalRole
        });
      
      if (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      } else {
        console.log(`   ✅ ${user.email} → ${finalRole}`);
      }
    }
    
    console.log('\n✅ Roles adicionadas!');
    
    // 3. Verificar resultado
    console.log('\n3. Verificação final...\n');
    
    let companyCount = 0;
    let motoboyCount = 0;
    
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
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Empresas: ${companyCount}`);
    console.log(`   Motoboys: ${motoboyCount}`);
    console.log(`   Total: ${companyCount + motoboyCount}/${users.length}`);
    
    rl.close();

  } catch (error) {
    console.error('❌ Erro:', error.message);
    rl.close();
  }
}

fixUserRoles();
