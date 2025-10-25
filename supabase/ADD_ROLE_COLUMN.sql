-- ============================================
-- ADICIONAR COLUNA ROLE NA TABELA PROFILES
-- ============================================
-- A coluna role está faltando na tabela profiles!
-- ============================================

-- 1. Verificar se enum user_role existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    -- Criar enum se não existir
    CREATE TYPE user_role AS ENUM ('company', 'motoboy');
    RAISE NOTICE '✅ Enum user_role criado';
  ELSE
    RAISE NOTICE '✅ Enum user_role já existe';
  END IF;
END $$;

-- 2. Adicionar coluna role se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    -- Adicionar coluna role
    ALTER TABLE public.profiles 
    ADD COLUMN role user_role NOT NULL DEFAULT 'motoboy';
    
    RAISE NOTICE '✅ Coluna role adicionada à tabela profiles';
  ELSE
    RAISE NOTICE '⚠️ Coluna role já existe na tabela profiles';
  END IF;
END $$;

-- 3. Verificar estrutura da tabela profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- AGORA EXECUTAR FIX_SIGNUP_ERROR.sql
-- ============================================
-- Após executar este script, execute o FIX_SIGNUP_ERROR.sql
-- para recriar a função handle_new_user()
-- ============================================

SELECT '✅ COLUNA ROLE ADICIONADA!' AS resultado;
SELECT '📝 Agora execute o arquivo FIX_SIGNUP_ERROR.sql' AS proximo_passo;
