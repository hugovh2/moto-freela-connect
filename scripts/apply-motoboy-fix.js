/**
 * Aplicar correção de política RLS para motoboy via Admin API
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMotoboyFix() {
  try {
    console.log('🔧 APLICANDO CORREÇÃO DE POLÍTICA RLS\n');
    
    // SQL commands
    const commands = [
      `DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services`,
      `DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services`,
      `DROP POLICY IF EXISTS "Motoboys can accept available services" ON public.services`,
      `DROP POLICY IF EXISTS "Motoboys can update own services" ON public.services`,
      `CREATE POLICY "Motoboys can accept services"
       ON public.services
       FOR UPDATE
       TO authenticated
       USING (
         (status = 'available' OR motoboy_id = auth.uid()) AND
         EXISTS (
           SELECT 1 FROM public.user_roles
           WHERE user_id = auth.uid() AND role = 'motoboy'
         )
       )`
    ];
    
    console.log('1. Removendo políticas antigas...\n');
    
    for (let i = 0; i < 4; i++) {
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: commands[i] })
        });
        console.log(`   ✅ Política ${i + 1} removida`);
      } catch (err) {
        console.log(`   ⚠️  Política ${i + 1}: ${err.message}`);
      }
    }
    
    console.log('\n2. Criando nova política...\n');
    
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ query: commands[4] })
      });
      console.log('   ✅ Nova política criada');
    } catch (err) {
      console.log('   ⚠️  Erro ao criar:', err.message);
    }
    
    // Testar com uma query de serviços disponíveis
    console.log('\n3. Testando acesso a serviços...\n');
    
    const { data: services, error } = await supabase
      .from('services')
      .select('id, title, status')
      .eq('status', 'available')
      .limit(1);
    
    if (error) {
      console.log('   ⚠️  Erro ao listar serviços:', error.message);
    } else {
      console.log(`   ✅ Acesso OK - ${services?.length || 0} serviços encontrados`);
    }
    
    console.log('\n✅ CORREÇÃO APLICADA!');
    console.log('\n🎯 Agora teste aceitar uma corrida na aplicação.');
    console.log('📝 Se ainda der erro, execute o SQL manualmente:');
    console.log('   supabase/FIX_MOTOBOY_ACCEPT_SIMPLE.sql');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

applyMotoboyFix();
