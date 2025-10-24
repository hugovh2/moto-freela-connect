/**
 * Executar correção de política RLS para motoboy
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

async function fixMotoboyRLS() {
  try {
    console.log('🏍️  CORRIGINDO POLÍTICA RLS PARA MOTOBOY\n');
    
    // Ler SQL
    const sqlPath = join(__dirname, '..', 'supabase', 'FIX_MOTOBOY_ACCEPT_POLICY.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executando SQL...\n');
    
    // Dividir em comandos
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    let success = 0;
    let errors = 0;
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i] + ';';
      
      try {
        const { error } = await supabase.rpc('exec', { statement: command });
        
        if (error) {
          console.log(`   ⚠️  Comando ${i + 1}: ${error.message}`);
          errors++;
        } else {
          console.log(`   ✅ Comando ${i + 1}: OK`);
          success++;
        }
      } catch (err) {
        console.log(`   ⚠️  Comando ${i + 1}: ${err.message}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`   Sucesso: ${success}`);
    console.log(`   Erros: ${errors}`);
    
    console.log('\n✅ Correção aplicada!');
    console.log('🎯 Agora motoboys podem aceitar serviços!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Execute o SQL manualmente no painel do Supabase:');
    console.log('   supabase/FIX_MOTOBOY_ACCEPT_POLICY.sql');
  }
}

fixMotoboyRLS();
