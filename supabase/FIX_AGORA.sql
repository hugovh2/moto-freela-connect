-- ============================================
-- CORREÇÃO DEFINITIVA - EXECUTE AGORA
-- Copie TUDO e cole no SQL Editor do Supabase
-- ============================================

-- 1. ADICIONAR 'collected' AO ENUM (ignora se já existir)
DO $$
BEGIN
  -- Tentar adicionar 'collected' após 'accepted'
  BEGIN
    ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'collected' AFTER 'accepted';
    RAISE NOTICE '✅ Status "collected" adicionado ao enum';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ Status "collected" já existe';
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ Enum já contém collected ou erro: %', SQLERRM;
  END;
END $$;

-- 2. GARANTIR COLUNA photo_url
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. GARANTIR BUCKET service-photos EXISTE E É PÚBLICO
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos',
  'service-photos',
  true,
  5242880, -- 5MB
  ARRAY['image/*']
)
ON CONFLICT (id) 
DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/*'];

-- 4. REMOVER TODAS AS POLÍTICAS ANTIGAS DE STORAGE
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND policyname LIKE '%service%photo%' OR policyname LIKE '%storage%'
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
      RAISE NOTICE '🗑️ Removida política: %', pol.policyname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao remover %: %', pol.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

-- 5. CRIAR POLÍTICAS DE STORAGE (SEM CONFLITO)
CREATE POLICY "service_photos_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "service_photos_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

CREATE POLICY "service_photos_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "service_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 6. REMOVER POLÍTICAS ANTIGAS DE services (UPDATE)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'services'
    AND cmd = 'UPDATE'
    AND policyname LIKE '%motoboy%'
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.services', pol.policyname);
      RAISE NOTICE '🗑️ Removida política services: %', pol.policyname;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Erro ao remover %: %', pol.policyname, SQLERRM;
    END;
  END LOOP;
END $$;

-- 7. CRIAR POLÍTICA DEFINITIVA PARA MOTOBOY ATUALIZAR
CREATE POLICY "motoboy_update_own_services"
ON public.services FOR UPDATE
TO authenticated
USING (
  motoboy_id = auth.uid() 
  AND 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'motoboy'
  )
)
WITH CHECK (
  motoboy_id = auth.uid()
);

-- ============================================
-- VERIFICAÇÕES FINAIS
-- ============================================

-- Mostrar valores do enum
SELECT '=== VALORES DO ENUM service_status ===' as info;
SELECT enumlabel as status, enumsortorder as ordem
FROM pg_enum 
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- Mostrar bucket
SELECT '=== BUCKET service-photos ===' as info;
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'service-photos';

-- Mostrar políticas de storage
SELECT '=== POLÍTICAS DE STORAGE ===' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%service%' OR policyname LIKE '%storage%')
ORDER BY policyname;

-- Mostrar políticas de services
SELECT '=== POLÍTICAS UPDATE DE SERVICES ===' as info;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'services'
AND cmd = 'UPDATE'
ORDER BY policyname;

-- Resultado final
SELECT '✅ CORREÇÕES APLICADAS COM SUCESSO!' as resultado;
SELECT 'Recarregue o navegador (Ctrl+Shift+R) e teste novamente' as proxima_acao;
