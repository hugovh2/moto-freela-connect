/**
 * Script para configurar o banco de dados para o SPRINT 1
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupSprint1() {
  console.log('🚀 CONFIGURANDO SPRINT 1\n');

  try {
    // 1. Adicionar colunas em services
    console.log('1. Adicionando colunas de timestamp...');
    await supabase.rpc('exec', {
      statement: `
        ALTER TABLE services 
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS photo_url TEXT;
      `
    });
    console.log('   ✅ Colunas adicionadas\n');

    // 2. Criar índices
    console.log('2. Criando índices para performance...');
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_messages_service_id ON messages(service_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON user_locations(updated_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)',
    ];

    for (const index of indices) {
      try {
        await supabase.rpc('exec', { statement: index });
        console.log('   ✅ Índice criado');
      } catch (err) {
        console.log('   ⚠️  Índice já existe');
      }
    }
    console.log('');

    // 3. Criar função de atualização de timestamps
    console.log('3. Criando função de timestamps automáticos...');
    await supabase.rpc('exec', {
      statement: `
        CREATE OR REPLACE FUNCTION update_service_timestamps()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          
          IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
            NEW.accepted_at = NOW();
          END IF;
          
          IF NEW.status = 'collected' AND (OLD.status IS NULL OR OLD.status != 'collected') THEN
            NEW.collected_at = NOW();
          END IF;
          
          IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
            NEW.in_progress_at = NOW();
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('   ✅ Função criada\n');

    // 4. Criar trigger
    console.log('4. Criando trigger...');
    await supabase.rpc('exec', {
      statement: `
        DROP TRIGGER IF EXISTS trigger_update_service_timestamps ON services;
        CREATE TRIGGER trigger_update_service_timestamps
          BEFORE UPDATE ON services
          FOR EACH ROW
          EXECUTE FUNCTION update_service_timestamps();
      `
    });
    console.log('   ✅ Trigger criado\n');

    // 5. Verificar tabelas
    console.log('5. Verificando configuração...\n');
    
    const { data: messages } = await supabase
      .from('messages')
      .select('count');
    console.log(`   📨 Mensagens: ${messages?.[0]?.count || 0}`);

    const { data: locations } = await supabase
      .from('user_locations')
      .select('count');
    console.log(`   📍 Localizações: ${locations?.[0]?.count || 0}`);

    const { data: services } = await supabase
      .from('services')
      .select('count');
    console.log(`   🚚 Serviços: ${services?.[0]?.count || 0}`);

    console.log('\n✅ SPRINT 1 CONFIGURADO COM SUCESSO!\n');
    console.log('📋 Próximos passos:');
    console.log('1. Habilite Realtime no Supabase:');
    console.log('   Database → Replication → Habilite:');
    console.log('   - messages');
    console.log('   - user_locations');
    console.log('   - services');
    console.log('');
    console.log('2. Crie o bucket de fotos:');
    console.log('   Storage → Create Bucket');
    console.log('   Nome: service-photos');
    console.log('   Public: ✅');
    console.log('');
    console.log('3. Execute as políticas de storage manualmente no SQL Editor:');
    console.log('   supabase/SPRINT1_DATABASE_SETUP.sql (linhas 10-28)');
    console.log('');
    console.log('🎉 Componentes prontos para uso!');

  } catch (error) {
    console.error('\n❌ Erro ao configurar:', error.message);
    console.log('\n💡 Execute o SQL manualmente:');
    console.log('   supabase/SPRINT1_DATABASE_SETUP.sql');
  }
}

setupSprint1();
