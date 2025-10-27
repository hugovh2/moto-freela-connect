-- ========================================
-- SQL FINAL PARA BUCKET AVATARS (SEM ERROS)
-- Execute DEPOIS de criar o bucket manualmente
-- ========================================

-- IMPORTANTE: Você DEVE criar o bucket MANUALMENTE primeiro!
-- Dashboard → Storage → New bucket → Nome: avatars → Public: YES

-- ========================================
-- PASSO 1: REMOVER POLICIES ANTIGAS
-- ========================================

-- Remove TODAS as policies relacionadas ao bucket avatars (se existirem)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND (
            policyname LIKE '%avatar%' 
            OR policyname LIKE '%public%read%'
            OR policyname LIKE '%authenticated%'
        )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON storage.objects';
        RAISE NOTICE 'Removida policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- ========================================
-- PASSO 2: CRIAR POLICIES NOVAS
-- ========================================

-- Policy 1: Qualquer um pode VER avatars (público)
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy 2: Usuários autenticados podem FAZER UPLOAD
CREATE POLICY "avatars_authenticated_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy 3: Usuários autenticados podem ATUALIZAR
CREATE POLICY "avatars_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy 4: Usuários autenticados podem DELETAR
CREATE POLICY "avatars_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- ========================================
-- PASSO 3: VERIFICAR SE FOI CRIADO
-- ========================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatars%'
ORDER BY policyname;

-- ========================================
-- RESULTADO ESPERADO:
-- Deve mostrar 4 policies:
-- 1. avatars_public_read
-- 2. avatars_authenticated_upload  
-- 3. avatars_authenticated_update
-- 4. avatars_authenticated_delete
-- ========================================
