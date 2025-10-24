/**
 * Script para executar migration no Supabase
 * Uso: node scripts/run-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migration...\n');

    // Ler arquivo SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251024_add_new_features.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Arquivo de migration carregado');
    console.log(`📏 Tamanho: ${sql.length} caracteres\n`);

    // Executar SQL
    console.log('⚡ Executando SQL no Supabase...\n');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar migration:', error);
      process.exit(1);
    }

    console.log('✅ Migration executada com sucesso!\n');
    console.log('📊 Tabelas criadas:');
    console.log('   - ratings');
    console.log('   - chat_messages');
    console.log('\n🎮 Campos adicionados ao profiles:');
    console.log('   - badges, level, experience');
    console.log('   - cnh_url, crlv_url, selfie_url, vehicle_photo_url');
    console.log('   - documents_verified, documents_verified_at');
    console.log('\n🔒 Políticas RLS configuradas');
    console.log('⚡ Realtime habilitado para chat_messages');
    console.log('🎯 Funções auxiliares criadas');
    console.log('🔔 Triggers configurados');
    console.log('\n✨ Tudo pronto para usar as novas funcionalidades!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

// Executar
runMigration();
