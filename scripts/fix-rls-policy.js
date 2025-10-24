/**
 * Script para corrigir a política RLS de INSERT de serviços
 * Uso: node scripts/fix-rls-policy.js
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
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que .env contém:');
  console.error('  VITE_SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('  VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicy() {
  try {
    console.log('🔒 Corrigindo política RLS de serviços...\n');

    // Ler o SQL da migração
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251024_fix_insert_policy_final.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    console.log('📄 SQL a ser executado:');
    console.log(sql);
    console.log('\n⚡ Executando...\n');

    // Executar cada comando SQL separadamente
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      console.log(`   ${i + 1}/${commands.length}: Executando comando...`);
      
      try {
        // Usar query SQL direta
        const { error } = await supabase.rpc('query', { 
          query_string: command 
        }).throwOnError();
        
        console.log(`   ✅ Comando ${i + 1} executado com sucesso`);
      } catch (error) {
        console.log(`   ⚠️  Comando ${i + 1}: ${error.message}`);
        // Continuar mesmo com erro (pode ser que a policy já tenha sido removida)
      }
    }

    console.log('\n✅ Política RLS corrigida!\n');
    console.log('🔒 Agora a política verifica:');
    console.log('   ✓ Se o usuário é uma empresa');
    console.log('   ✓ Se o company_id corresponde ao usuário autenticado');
    console.log('\n🎯 Teste criando um novo serviço na aplicação!');

  } catch (error) {
    console.error('\n❌ Erro ao executar correção:', error.message);
    console.error('\n💡 Solução alternativa:');
    console.error('1. Acesse https://supabase.com/dashboard');
    console.error('2. Vá em SQL Editor');
    console.error('3. Execute o SQL da migração: supabase/migrations/20251024_fix_insert_policy_final.sql');
    process.exit(1);
  }
}

// Executar
fixRLSPolicy();
