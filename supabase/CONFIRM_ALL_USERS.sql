-- CONFIRMAR TODOS OS USUÁRIOS EXISTENTES
-- Esta abordagem funciona através da API interna do Supabase

-- 1. Usar a função administrativa do Supabase para confirmar emails
-- Execute este bloco para cada email que você quer confirmar:

-- Para o seu email principal:
SELECT auth.admin_confirm_user_by_email('vitorhugo1524@gmail.com');

-- Para emails de teste recentes (substitua pelos emails reais):
-- Você pode ver os emails na tabela auth.users:
SELECT email FROM auth.users ORDER BY created_at DESC;

-- Função para confirmar TODOS os usuários de uma vez (use com cuidado)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email FROM auth.users WHERE email_confirmed_at IS NULL
    LOOP
        -- Tentar confirmar via função admin
        BEGIN
            PERFORM auth.admin_confirm_user_by_email(user_record.email);
            RAISE NOTICE 'Confirmado: %', user_record.email;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao confirmar %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
END;
$$;

-- Verificar resultado após execução
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;
