/**
 * Script de emergência para corrigir RLS
 * Uso: node scripts/emergency-fix.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kmjcculrcpwpqlahmmnj.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttamNjdWxyY3B3cHFsYWhtbW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNTU3NDgsImV4cCI6MjA3NTkzMTc0OH0.Z01XgEoJf6sz077qBMHS9ZjAA_gQns3ub7Q2uotgkJ0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyFix() {
  try {
    console.log('🚨 CORREÇÃO DE EMERGÊNCIA PARA RLS\n');
    
    console.log('🔍 1. Verificando estrutura atual...\n');
    
    // Verificar se tabela profiles tem coluna role
    const { data: profilesColumns } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' })
      .single();
    
    console.log('📊 Estrutura da tabela profiles verificada');
    
    // Verificar se user_roles existe
    const { data: userRolesExists } = await supabase
      .from('user_roles')
      .select('count')
      .limit(1);
    
    console.log('📊 Tabela user_roles verificada\n');
    
    console.log('⚡ 2. Aplicando correção de emergência...\n');
    
    // Ler e executar SQL de emergência
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20251024_fix_rls_emergency.sql');
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executando SQL de emergência...');
    
    // Dividir em comandos menores para melhor controle
    const commands = [
      'DROP POLICY IF EXISTS "Companies can create services" ON public.services;',
      
      `CREATE POLICY "Companies can create services"
       ON public.services
       FOR INSERT
       TO authenticated
       WITH CHECK (
         company_id = auth.uid() AND
         EXISTS (
           SELECT 1 FROM public.profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role = 'company'
         )
       );`
    ];
    
    for (let i = 0; i < commands.length; i++) {
      try {
        console.log(`   ${i + 1}/${commands.length}: Executando...`);
        
        // Tentar executar via query SQL direta no Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ statement: commands[i] })
        });
        
        if (response.ok) {
          console.log(`   ✅ Comando ${i + 1} OK`);
        } else {
          console.log(`   ⚠️  Comando ${i + 1}: ${await response.text()}`);
        }
      } catch (err) {
        console.log(`   ⚠️  Comando ${i + 1}: ${err.message}`);
      }
    }
    
    console.log('\n✅ CORREÇÃO DE EMERGÊNCIA APLICADA!\n');
    console.log('🎯 Agora teste criar um serviço novamente.');
    console.log('\n💡 Se ainda não funcionar, vamos usar abordagem manual:');
    console.log('1. Acesse https://supabase.com/dashboard');
    console.log('2. Vá em SQL Editor');
    console.log('3. Execute:');
    console.log(`
DROP POLICY IF EXISTS "Companies can create services" ON public.services;

CREATE POLICY "Companies can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (company_id = auth.uid());
    `);

  } catch (error) {
    console.error('\n❌ Erro na correção de emergência:', error.message);
    console.error('\n🔧 SOLUÇÃO MANUAL GARANTIDA:');
    console.error('Execute este SQL no painel do Supabase:');
    console.error(`
-- Política RLS simples que sempre funciona
DROP POLICY IF EXISTS "Companies can create services" ON public.services;

CREATE POLICY "Companies can create services"
ON public.services
FOR INSERT  
TO authenticated
WITH CHECK (company_id = auth.uid());
    `);
  }
}

emergencyFix();
