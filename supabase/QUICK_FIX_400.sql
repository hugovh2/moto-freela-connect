-- ============================================
-- QUICK FIX: 400 Bad Request + RLS + Enum
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1) Garantir que o enum tenha 'collected'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'service_status'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'collected'
      AND enumtypid = 'service_status'::regtype
    ) THEN
      ALTER TYPE service_status ADD VALUE 'collected' AFTER 'accepted';
      RAISE NOTICE 'Status "collected" adicionado ao enum service_status';
    ELSE
      RAISE NOTICE 'Status "collected" já existe no enum service_status';
    END IF;
  ELSE
    RAISE NOTICE 'Enum service_status não existe. Criando com todos os valores padrão...';
    CREATE TYPE service_status AS ENUM (
      'available','accepted','collected','in_progress','completed','cancelled'
    );
  END IF;
END $$;

-- 2) Garantir coluna de foto na tabela services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3) Garantir bucket 'service-photos' existe e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 4) Recriar políticas de Storage para o bucket 'service-photos'
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;

CREATE POLICY "storage_insert_authenticated"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'service-photos' );

CREATE POLICY "storage_select_public"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'service-photos' );

CREATE POLICY "storage_update_authenticated"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'service-photos' )
WITH CHECK ( bucket_id = 'service-photos' );

CREATE POLICY "storage_delete_authenticated"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'service-photos' );

-- 5) Simplificar política de UPDATE na tabela services
-- Permitir que o motoboy atualize o serviço que está assignado a ele
DROP POLICY IF EXISTS "motoboy_can_update_assigned" ON public.services;
CREATE POLICY "motoboy_can_update_assigned"
ON public.services FOR UPDATE
TO authenticated
USING ( motoboy_id = auth.uid() )
WITH CHECK ( motoboy_id = auth.uid() );

-- 6) Verificações
SELECT '=== ENUM service_status ===' AS check_type;
SELECT enumlabel, enumsortorder
FROM pg_enum 
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

SELECT '=== STORAGE POLICIES ===' AS check_type;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

SELECT '=== SERVICES UPDATE POLICIES ===' AS check_type;
SELECT policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services' AND cmd = 'UPDATE';

SELECT '=== BUCKETS ===' AS check_type;
SELECT id, name, public FROM storage.buckets WHERE id = 'service-photos';
