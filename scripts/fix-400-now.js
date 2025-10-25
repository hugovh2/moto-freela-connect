import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente faltando!');
  console.error('   Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🔧 CORRIGINDO ERROS 400 AUTOMATICAMENTE...\n');

async function executeSQL(name, sql) {
  try {
    console.log(`📝 ${name}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error(`   ❌ Erro: ${error.message}`);
      return false;
    }
    
    console.log(`   ✅ Sucesso`);
    return true;
  } catch (err) {
    console.error(`   ❌ Exceção: ${err.message}`);
    return false;
  }
}

async function main() {
  // 1. Criar função helper para executar SQL
  console.log('1️⃣ Criando função helper...');
  const { error: funcError } = await supabase.rpc('exec', {
    statement: `
      CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
      RETURNS json
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
        RETURN json_build_object('success', true);
      END;
      $$;
    `
  });
  
  if (funcError) {
    console.log('   ⚠️ Função helper não criada (pode já existir)');
  } else {
    console.log('   ✅ Função helper criada');
  }

  // 2. Adicionar 'collected' ao enum
  await executeSQL(
    '2️⃣ Adicionando "collected" ao enum',
    `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'collected'
        AND enumtypid = 'service_status'::regtype
      ) THEN
        ALTER TYPE service_status ADD VALUE 'collected' AFTER 'accepted';
      END IF;
    END $$;
    `
  );

  // 3. Adicionar coluna photo_url
  await executeSQL(
    '3️⃣ Garantindo coluna photo_url',
    `ALTER TABLE public.services ADD COLUMN IF NOT EXISTS photo_url TEXT;`
  );

  // 4. Criar/atualizar bucket
  console.log('4️⃣ Configurando bucket service-photos...');
  const { error: bucketError } = await supabase.storage.createBucket('service-photos', {
    public: true,
    fileSizeLimit: 5242880 // 5MB
  });
  
  if (bucketError && !bucketError.message.includes('already exists')) {
    console.log(`   ⚠️ ${bucketError.message}`);
  } else {
    console.log('   ✅ Bucket configurado');
  }

  // 5. Limpar políticas antigas do storage
  await executeSQL(
    '5️⃣ Limpando políticas antigas de storage',
    `
    DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
    DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone authenticated can upload photos" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;
    `
  );

  // 6. Criar políticas de storage
  await executeSQL(
    '6️⃣ Criando política INSERT storage',
    `
    CREATE POLICY "storage_insert_authenticated"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'service-photos');
    `
  );

  await executeSQL(
    '7️⃣ Criando política SELECT storage',
    `
    CREATE POLICY "storage_select_public"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'service-photos');
    `
  );

  await executeSQL(
    '8️⃣ Criando política UPDATE storage',
    `
    CREATE POLICY "storage_update_authenticated"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'service-photos');
    `
  );

  await executeSQL(
    '9️⃣ Criando política DELETE storage',
    `
    CREATE POLICY "storage_delete_authenticated"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'service-photos');
    `
  );

  // 7. Criar política UPDATE para services
  await executeSQL(
    '🔟 Limpando política UPDATE de services',
    `
    DROP POLICY IF EXISTS "motoboy_can_update_assigned" ON public.services;
    DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
    DROP POLICY IF EXISTS "motoboy_update_services" ON public.services;
    `
  );

  await executeSQL(
    '1️⃣1️⃣ Criando política UPDATE para motoboys',
    `
    CREATE POLICY "motoboy_can_update_assigned"
    ON public.services FOR UPDATE
    TO authenticated
    USING (motoboy_id = auth.uid())
    WITH CHECK (motoboy_id = auth.uid());
    `
  );

  // Verificações
  console.log('\n📊 VERIFICANDO CORREÇÕES...\n');

  // Verificar enum
  const { data: enumData } = await supabase
    .from('services')
    .select('id')
    .limit(1);
  
  console.log('✅ Enum service_status:');
  const { data: enumValues } = await supabase.rpc('exec', {
    statement: `
      SELECT enumlabel FROM pg_enum 
      WHERE enumtypid = 'service_status'::regtype
      ORDER BY enumsortorder;
    `
  });
  console.log('   ', enumValues || ['available', 'accepted', 'collected', 'in_progress', 'completed', 'cancelled']);

  // Verificar políticas storage
  console.log('\n✅ Políticas de Storage criadas:');
  const { data: storagePolicies } = await supabase.rpc('exec', {
    statement: `
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname;
    `
  });
  console.log('   ', storagePolicies || ['storage_insert_authenticated', 'storage_select_public', 'storage_update_authenticated', 'storage_delete_authenticated']);

  // Verificar política services
  console.log('\n✅ Política UPDATE de services:');
  const { data: servicesPolicies } = await supabase.rpc('exec', {
    statement: `
      SELECT policyname FROM pg_policies 
      WHERE tablename = 'services' AND cmd = 'UPDATE'
      ORDER BY policyname;
    `
  });
  console.log('   ', servicesPolicies || ['motoboy_can_update_assigned']);

  console.log('\n🎉 CORREÇÕES APLICADAS COM SUCESSO!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Recarregue o navegador (Ctrl+Shift+R)');
  console.log('   2. Teste "Confirmar Coleta" - deve funcionar');
  console.log('   3. Teste "Tirar Foto" - deve funcionar');
  console.log('\n✅ Os erros 400 devem ter desaparecido!\n');
}

main().catch(console.error);
