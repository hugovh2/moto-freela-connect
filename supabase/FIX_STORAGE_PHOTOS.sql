-- ============================================
-- CORREÇÃO COMPLETA DO STORAGE DE FOTOS
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que o bucket service-photos existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-photos', 
  'service-photos', 
  true, 
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Remover políticas antigas do storage
DROP POLICY IF EXISTS "storage_insert_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "storage_update_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "storage_delete_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Anyone authenticated can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete photos" ON storage.objects;

-- 3. Criar políticas corretas para o bucket service-photos
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
USING (bucket_id = 'service-photos')
WITH CHECK (bucket_id = 'service-photos');

CREATE POLICY "service_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 4. Verificar se o bucket foi criado corretamente
SELECT '=== BUCKET CRIADO ===' AS info;
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'service-photos';

-- 5. Verificar políticas do storage
SELECT '=== POLÍTICAS DO STORAGE ===' AS info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
