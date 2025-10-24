-- DESABILITAR CONFIRMAÇÃO DE EMAIL NO SUPABASE
-- Execute este SQL para permitir login sem confirmação

-- 1. Confirmar todos os emails existentes automaticamente
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- 2. Marcar todos os emails como confirmados
UPDATE auth.users SET confirmed_at = NOW() WHERE confirmed_at IS NULL;

-- Função para confirmar um email específico (caso precise)
CREATE OR REPLACE FUNCTION confirm_user_email(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_found BOOLEAN;
BEGIN
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW(),
    confirmed_at = NOW()
  WHERE email = user_email;
  
  GET DIAGNOSTICS user_found = FOUND;
  
  IF user_found THEN
    RETURN 'Email confirmado: ' || user_email;
  ELSE
    RETURN 'Email não encontrado: ' || user_email;
  END IF;
END;
$$;

-- Confirmar o email do teste que criamos
SELECT confirm_user_email('user1761343488598@gmail.com');

-- Confirmar seu email também (se existir)
SELECT confirm_user_email('vitorhugo1524@gmail.com');
