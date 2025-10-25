-- ============================================
-- LIMPAR USUÁRIOS DE AUTENTICAÇÃO
-- ============================================
-- ⚠️ ATENÇÃO: Remove TODOS os usuários do auth.users
-- ⚠️ Use isso para limpar completamente o sistema
-- ============================================

-- Verificar quantos usuários existem ANTES
SELECT 
  'Usuários ANTES da limpeza' as info,
  COUNT(*) as total
FROM auth.users;

-- ============================================
-- DELETAR TODOS OS USUÁRIOS
-- ============================================
-- Isso vai:
-- 1. Deletar todos os registros de auth.users
-- 2. Por CASCADE, deletar automaticamente os profiles
-- 3. Por CASCADE, deletar automaticamente services, messages, etc
-- ============================================

DELETE FROM auth.users;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  'Usuários APÓS limpeza' as info,
  COUNT(*) as total
FROM auth.users;

SELECT 
  'Profiles restantes' as info,
  COUNT(*) as total
FROM public.profiles;

SELECT 
  'Services restantes' as info,
  COUNT(*) as total
FROM public.services;

-- ============================================
-- RESULTADO
-- ============================================
SELECT '✅ TODOS OS USUÁRIOS FORAM REMOVIDOS!' AS resultado;
SELECT '📧 Agora você pode cadastrar novamente com os mesmos emails' AS info;
