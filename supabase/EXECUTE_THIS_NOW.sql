-- ============================================
-- EXECUTE ESTE SQL NO SQL EDITOR DO SUPABASE
-- ============================================

-- 1. ADICIONAR 'collected' AO ENUM service_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'collected' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
  ) THEN
    ALTER TYPE service_status ADD VALUE 'collected' AFTER 'accepted';
    RAISE NOTICE '✅ Status "collected" adicionado';
  ELSE
    RAISE NOTICE '✅ Status "collected" já existe';
  END IF;
END $$;

-- 2. ADICIONAR COLUNA photo_url SE NÃO EXISTIR
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. REMOVER TODAS AS POLÍTICAS ANTIGAS DE STORAGE
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;

-- 4. CRIAR POLÍTICAS SIMPLES DE STORAGE
CREATE POLICY "storage_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "storage_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

CREATE POLICY "storage_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "storage_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 5. REMOVER POLÍTICAS ANTIGAS DE SERVICES
DROP POLICY IF EXISTS "Motoboys can accept services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update own services" ON public.services;
DROP POLICY IF EXISTS "Motoboys can update assigned services" ON public.services;
DROP POLICY IF EXISTS "motoboy_update_services" ON public.services;

-- 6. CRIAR POLÍTICA SIMPLES E FUNCIONAL PARA MOTOBOYS
CREATE POLICY "motoboy_update_services"
ON public.services FOR UPDATE
TO authenticated
USING (
  -- Motoboy pode atualizar se:
  -- 1. É o motoboy assignado, OU
  -- 2. O serviço está disponível (para aceitar)
  (motoboy_id = auth.uid() OR (status = 'available' AND motoboy_id IS NULL))
  AND
  -- E tem role de motoboy
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'motoboy'
  )
);

-- 7. VERIFICAÇÕES
SELECT '=== ENUM service_status ===' as check_type;
SELECT enumlabel, enumsortorder
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
ORDER BY enumsortorder;

SELECT '=== POLÍTICAS DE STORAGE ===' as check_type;
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

SELECT '=== POLÍTICAS DE SERVICES (UPDATE) ===' as check_type;
SELECT policyname, cmd
FROM pg_policies 
WHERE tablename = 'services' AND cmd = 'UPDATE'
ORDER BY policyname;

SELECT '=== ESTRUTURA DA TABELA SERVICES ===' as check_type;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'services' AND column_name IN ('photo_url', 'status')
ORDER BY ordinal_position;

SELECT '✅ EXECUTE CONCLUÍDA COM SUCESSO!' as resultado;
