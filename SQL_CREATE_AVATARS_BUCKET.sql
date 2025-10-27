-- ========================================
-- CRIAR BUCKET AVATARS E PERMISSÕES
-- Execute no Supabase Dashboard → SQL Editor
-- ========================================

-- IMPORTANTE: Este SQL deve ser executado no SQL Editor do Supabase
-- NÃO tente criar bucket via SQL, use o Dashboard!

-- ========================================
-- PASSO 1: Criar bucket manualmente
-- ========================================
-- 1. Ir para: Storage → Create Bucket
-- 2. Nome: avatars
-- 3. Public: YES (marcar)
-- 4. Clicar em "Create bucket"

-- ========================================
-- PASSO 2: Executar este SQL para permissões
-- ========================================

-- Permitir TODOS verem os avatars (público)
INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
VALUES ('avatars', '.emptyFolderPlaceholder', null, now(), now(), now(), '{}')
ON CONFLICT DO NOTHING;

-- Remover policies antigas se existirem (evita erro de duplicação)
DROP POLICY IF EXISTS "Usuários podem fazer upload de avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar próprio avatar" ON storage.objects;

-- Policy: Permitir usuários autenticados fazerem upload
CREATE POLICY "Usuários podem fazer upload de avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy: Avatars são públicos (qualquer um pode ver)
CREATE POLICY "Avatars são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Usuários podem atualizar seu próprio avatar
CREATE POLICY "Usuários podem atualizar próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy: Usuários podem deletar seu próprio avatar
CREATE POLICY "Usuários podem deletar próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- Verificar policies criadas
SELECT * FROM pg_policies WHERE tablename = 'objects';
