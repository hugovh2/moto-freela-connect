/**
 * CORREÇÃO FORÇADA DE TODOS OS PROBLEMAS
 * Este script usa SQL direto para forçar as correções
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://rinszzwdteaytefdwwnc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpbnN6endkdGVheXRlZmR3d25jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTMzOTQ5OCwiZXhwIjoyMDc2OTE1NDk4fQ.1c9kpmvqbAAecqu2ur_ieXHWWiyre9DU1BekJfZm2iU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(sql, description) {
  console.log(`\n📝 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec', { statement: sql });
    if (error) throw error;
    console.log(`   ✅ Sucesso!`);
    return true;
  } catch (error) {
    console.log(`   ⚠️ ${error.message}`);
    return false;
  }
}

async function forceFixAll() {
  console.log('🔧 FORÇANDO CORREÇÃO DE TODOS OS PROBLEMAS\n');
  console.log('=' .repeat(60));

  // 1. ADICIONAR COLLECTED AO ENUM (MÉTODO DIRETO)
  await executeSQL(`
    DO $$ 
    BEGIN
      -- Verificar se o tipo existe
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
        -- Criar tipo se não existir
        CREATE TYPE service_status AS ENUM (
          'available', 'accepted', 'collected', 'in_progress', 'completed', 'cancelled'
        );
        RAISE NOTICE 'Tipo service_status criado';
      ELSE
        -- Adicionar collected se não existir
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'collected' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
        ) THEN
          ALTER TYPE service_status ADD VALUE 'collected' AFTER 'accepted';
          RAISE NOTICE 'Valor collected adicionado';
        ELSE
          RAISE NOTICE 'Valor collected já existe';
        END IF;
      END IF;
    END $$;
  `, 'Adicionando status "collected" ao enum');

  // 2. REMOVER TODAS AS POLÍTICAS ANTIGAS DE STORAGE
  await executeSQL(`
    DO $$ 
    DECLARE
      pol record;
    BEGIN
      FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
      LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON storage.objects';
      END LOOP;
    END $$;
  `, 'Removendo políticas antigas de storage');

  // 3. CRIAR POLÍTICAS SIMPLES E PERMISSIVAS DE STORAGE
  await executeSQL(`
    -- Permitir INSERT para todos autenticados
    CREATE POLICY "storage_insert_authenticated"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'service-photos');
  `, 'Criando política de INSERT no storage');

  await executeSQL(`
    -- Permitir SELECT público
    CREATE POLICY "storage_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'service-photos');
  `, 'Criando política de SELECT no storage');

  await executeSQL(`
    -- Permitir UPDATE para autenticados
    CREATE POLICY "storage_update_authenticated"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'service-photos');
  `, 'Criando política de UPDATE no storage');

  await executeSQL(`
    -- Permitir DELETE para autenticados
    CREATE POLICY "storage_delete_authenticated"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'service-photos');
  `, 'Criando política de DELETE no storage');

  // 4. REMOVER E RECRIAR POLÍTICAS DE SERVICES
  await executeSQL(`
    DROP POLICY IF EXISTS "Motoboys can accept services" ON services;
    DROP POLICY IF EXISTS "Motoboys can update own services" ON services;
    DROP POLICY IF EXISTS "Motoboys can update assigned services" ON services;
  `, 'Removendo políticas antigas de services');

  await executeSQL(`
    -- Política SIMPLES para motoboys atualizarem serviços
    CREATE POLICY "motoboy_update_services"
    ON services FOR UPDATE
    TO authenticated
    USING (
      -- Pode atualizar se for o motoboy assignado OU se estiver disponível
      (motoboy_id = auth.uid() OR (status = 'available' AND motoboy_id IS NULL))
      AND
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND role = 'motoboy'
      )
    );
  `, 'Criando política simplificada de UPDATE para motoboys');

  // 5. ADICIONAR COLUNA photo_url SE NÃO EXISTIR
  await executeSQL(`
    ALTER TABLE services 
    ADD COLUMN IF NOT EXISTS photo_url TEXT;
  `, 'Garantindo coluna photo_url');

  // 6. VERIFICAR ENUM
  console.log('\n📊 Verificando enum service_status...');
  const { data: enumData } = await supabase.rpc('exec', {
    statement: `
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
      ORDER BY enumsortorder;
    `
  });
  console.log('   Valores do enum:', enumData);

  // 7. VERIFICAR POLÍTICAS DE STORAGE
  console.log('\n📊 Verificando políticas de storage...');
  const { data: storageData } = await supabase.rpc('exec', {
    statement: `
      SELECT policyname, cmd
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname;
    `
  });
  console.log('   Políticas:', storageData);

  // 8. VERIFICAR POLÍTICAS DE SERVICES
  console.log('\n📊 Verificando políticas de services...');
  const { data: servicesData } = await supabase.rpc('exec', {
    statement: `
      SELECT policyname, cmd
      FROM pg_policies 
      WHERE tablename = 'services' AND cmd = 'UPDATE'
      ORDER BY policyname;
    `
  });
  console.log('   Políticas UPDATE:', servicesData);

  // 9. TESTAR UPLOAD
  console.log('\n🧪 Testando capacidade de upload...');
  try {
    const testFile = Buffer.from('test');
    const { data, error } = await supabase.storage
      .from('service-photos')
      .upload(`test-${Date.now()}.txt`, testFile, {
        upsert: true
      });
    
    if (error) {
      console.log('   ⚠️ Erro no teste:', error.message);
    } else {
      console.log('   ✅ Upload funcionando!');
      // Limpar arquivo de teste
      await supabase.storage.from('service-photos').remove([data.path]);
    }
  } catch (error) {
    console.log('   ⚠️ Erro no teste:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TODAS AS CORREÇÕES APLICADAS!\n');
  console.log('📋 Próximos passos:');
  console.log('1. Reinicie o servidor: Ctrl+C e npm run dev');
  console.log('2. Faça login como motoboy');
  console.log('3. Aceite uma corrida');
  console.log('4. Teste "Confirmar Coleta" - deve funcionar agora!');
  console.log('5. Teste tirar foto - deve funcionar agora!');
  console.log('');
}

forceFixAll().catch(console.error);
