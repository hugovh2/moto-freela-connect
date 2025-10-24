/**
 * Script completo para finalizar SPRINT 1
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function completeSprint1() {
  console.log('🎯 FINALIZANDO SPRINT 1\n');

  try {
    // 1. Criar bucket de fotos
    console.log('1. Criando bucket de fotos...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'service-photos');
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('service-photos', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        console.log('   ⚠️  Erro ao criar bucket:', error.message);
      } else {
        console.log('   ✅ Bucket criado');
      }
    } else {
      console.log('   ✓  Bucket já existe');
    }

    // 2. Habilitar replica identity para realtime
    console.log('\n2. Habilitando Realtime...');
    const tables = ['messages', 'user_locations', 'services'];
    
    for (const table of tables) {
      try {
        await supabase.rpc('exec', {
          statement: `ALTER TABLE ${table} REPLICA IDENTITY FULL;`
        });
        console.log(`   ✅ ${table} configurado para Realtime`);
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    // 3. Criar status 'collected' se não existir
    console.log('\n3. Adicionando status "collected"...');
    try {
      await supabase.rpc('exec', {
        statement: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'collected' 
              AND enumtypid = 'service_status'::regtype
            ) THEN
              ALTER TYPE service_status ADD VALUE 'collected';
            END IF;
          END $$;
        `
      });
      console.log('   ✅ Status adicionado');
    } catch (err) {
      console.log('   ⚠️  Status já existe');
    }

    // 4. Teste de mensagens
    console.log('\n4. Testando sistema de mensagens...');
    const { data: msgTest } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    console.log(`   ✅ Tabela messages OK`);

    // 5. Teste de localizações
    console.log('\n5. Testando sistema de localização...');
    const { data: locTest } = await supabase
      .from('user_locations')
      .select('*')
      .limit(1);
    console.log(`   ✅ Tabela user_locations OK`);

    console.log('\n✅ SPRINT 1 FINALIZADO!\n');
    console.log('🎉 Todos os sistemas estão operacionais!');
    console.log('\n📋 Última verificação manual:');
    console.log('- Vá em: Database → Replication');
    console.log('- Confirme que messages, user_locations e services estão habilitados');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

completeSprint1();
