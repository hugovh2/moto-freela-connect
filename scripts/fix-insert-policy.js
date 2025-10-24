/**
 * Script para corrigir a política de INSERT de serviços
 * Uso: node scripts/fix-insert-policy.js
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas!');
  console.error('Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY no arquivo .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixInsertPolicy() {
  try {
    console.log('🚀 Corrigindo política de INSERT para serviços...\n');

    // Ler arquivo SQL
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251024_fix_company_insert_policy.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 Arquivo de migration carregado');
    console.log(`📏 SQL a ser executado:\n${sql}\n`);

    // Executar SQL usando fetch direto para a API REST do Supabase
    console.log(`⚡ Executando SQL via API REST...\n`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro na resposta:', error);
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log('   ✅ SQL executado com sucesso');

    console.log('\n✅ Política de INSERT corrigida com sucesso!\n');
    console.log('🔒 Agora empresas podem criar serviços corretamente');
    console.log('✨ Teste criando um novo serviço na aplicação!');

  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error);
    console.error('\n💡 Dica: Execute o SQL manualmente no painel do Supabase:');
    console.error('   1. Acesse https://supabase.com/dashboard');
    console.error('   2. Vá em SQL Editor');
    console.error('   3. Cole o conteúdo do arquivo: supabase/migrations/20251024_fix_company_insert_policy.sql');
    process.exit(1);
  }
}

// Executar
fixInsertPolicy();
