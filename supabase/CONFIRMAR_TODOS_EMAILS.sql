-- ============================================
-- CONFIRMAR TODOS OS EMAILS AUTOMATICAMENTE
-- ============================================
-- Remove a necessidade de confirmação por email
-- Útil para desenvolvimento/testes
-- ============================================

-- PASSO 1: Confirmar TODOS os usuários existentes
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verificar quantos foram confirmados
SELECT 
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as emails_confirmados,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as emails_nao_confirmados,
  COUNT(*) as total_usuarios
FROM auth.users;

-- ============================================
-- RESULTADO
-- ============================================
SELECT '✅ TODOS OS EMAILS CONFIRMADOS!' AS resultado;
SELECT '📧 Agora você pode fazer login normalmente' AS info;
