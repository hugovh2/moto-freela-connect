-- CONFIGURAÇÃO SEGURA DE AUTENTICAÇÃO
-- Esta versão NÃO tenta modificar colunas protegidas do sistema

-- 1. Apenas verificar usuários existentes (sem modificar)
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Função para confirmar email de forma segura (usando API interna)
CREATE OR REPLACE FUNCTION public.safe_confirm_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  result TEXT;
BEGIN
  -- Encontrar o usuário
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN 'Usuário não encontrado: ' || user_email;
  END IF;
  
  -- Verificar se já está confirmado
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id AND email_confirmed_at IS NOT NULL) THEN
    RETURN 'Email já confirmado: ' || user_email;
  ELSE
    RETURN 'Email precisa ser confirmado via painel: ' || user_email;
  END IF;
END;
$$;

-- 3. Verificar status dos emails
SELECT public.safe_confirm_email('vitorhugo1524@gmail.com');

-- 4. Função para debug de autenticação
CREATE OR REPLACE FUNCTION public.debug_auth_status()
RETURNS TABLE (
  total_users BIGINT,
  confirmed_users BIGINT,
  unconfirmed_users BIGINT,
  recent_signups BIGINT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_signups
  FROM auth.users;
$$;

-- 5. Executar debug
SELECT * FROM public.debug_auth_status();

-- NOTA: Para desabilitar confirmação de email, use o painel web:
-- 1. Acesse: https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc
-- 2. Vá em: Authentication → Settings  
-- 3. Desmarque: "Enable email confirmations"
-- 4. Salve
