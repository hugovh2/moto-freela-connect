-- ========================================
-- SQL SIMPLES PARA BUCKET AVATARS
-- ========================================

-- IMPORTANTE: Este SQL só funciona DEPOIS de criar o bucket manualmente!

-- ========================================
-- PASSO 1: Criar bucket MANUALMENTE no Dashboard
-- ========================================
-- Você DEVE fazer isso manualmente:
-- 1. Ir para: Storage → Create Bucket
-- 2. Nome: avatars
-- 3. Public: YES (marcar checkbox)
-- 4. Clicar "Create bucket"

-- ========================================
-- PASSO 2: Depois executar este SQL
-- ========================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Policy 1: Qualquer um pode VER avatars
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 2: Usuários autenticados podem fazer UPLOAD
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 3: Usuários autenticados podem ATUALIZAR
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy 4: Usuários autenticados podem DELETAR
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verificar se as policies foram criadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%public%' OR policyname LIKE '%authenticated%';
