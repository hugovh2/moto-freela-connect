-- FORÇAR CONFIRMAÇÃO DE EMAILS (Método Alternativo)
-- Esta versão funciona sem funções administrativas especiais

-- 1. Confirmar apenas a coluna permitida (email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- 2. Verificar resultado
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 3. Listar usuários e seu status
SELECT 
  id,
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Confirmado'
    ELSE 'Não confirmado'
  END as status,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 4. Se ainda houver problemas, tente criar uma função auxiliar
CREATE OR REPLACE FUNCTION public.force_confirm_all_emails()
RETURNS TABLE (
  confirmed_count BIGINT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE email_confirmed_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT updated_count, 'Emails confirmados: ' || updated_count::TEXT;
END;
$$;

-- 5. Executar a função auxiliar
SELECT * FROM public.force_confirm_all_emails();
