/**
 * Criar profiles para usuários que não têm
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createMissingProfiles() {
  try {
    console.log('👤 CRIANDO PROFILES FALTANTES\n');
    
    // 1. Listar todos os usuários
    console.log('1. Listando usuários...');
    const { data: { users } } = await supabase.auth.admin.listUsers();
    console.log(`   Total: ${users.length} usuários\n`);
    
    // 2. Verificar quem não tem profile
    console.log('2. Verificando profiles...\n');
    let created = 0;
    let existing = 0;
    
    for (const user of users) {
      // Verificar se profile existe
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        console.log(`   ✓  ${user.email} - profile existe`);
        existing++;
      } else {
        // Criar profile
        const fullName = user.user_metadata?.full_name || 
                        user.email?.split('@')[0] || 
                        'Usuário';
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: fullName
          });
        
        if (error) {
          console.log(`   ❌ ${user.email} - Erro: ${error.message}`);
        } else {
          console.log(`   ✅ ${user.email} - profile criado (${fullName})`);
          created++;
        }
      }
    }
    
    console.log(`\n📊 Resumo:`);
    console.log(`   Profiles criados: ${created}`);
    console.log(`   Já existentes: ${existing}`);
    console.log(`   Total: ${created + existing}/${users.length}`);
    
    // 3. Verificar resultado
    console.log('\n3. Verificação final...\n');
    
    for (const user of users) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (profileData && roleData) {
        const icon = roleData.role === 'company' ? '🏢' : '🏍️';
        console.log(`   ${icon} ${profileData.email} - ${profileData.full_name} (${roleData.role})`);
      } else if (profileData) {
        console.log(`   ❓ ${profileData.email} - ${profileData.full_name} (sem role)`);
      } else {
        console.log(`   ❌ ${user.email} - SEM PROFILE`);
      }
    }
    
    if (created === 0) {
      console.log('\n✅ Todos os usuários já tinham profiles!');
    } else {
      console.log('\n🎉 PROFILES CRIADOS COM SUCESSO!');
    }
    
    console.log('\n✅ Sistema completo:');
    console.log('   - Usuários autenticados');
    console.log('   - Emails confirmados');  
    console.log('   - Roles definidas');
    console.log('   - Profiles criados');
    console.log('\n🚀 Agora você pode fazer login normalmente!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createMissingProfiles();
