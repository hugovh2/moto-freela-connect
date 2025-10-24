-- CORREÇÃO DE EMERGÊNCIA PARA AUTENTICAÇÃO
-- Execute IMEDIATAMENTE no Supabase

-- 1. Limpar todas as sessões inválidas
DELETE FROM auth.sessions WHERE expires_at < NOW();
DELETE FROM auth.refresh_tokens WHERE revoked = true;

-- 2. Resetar configurações de email validation
UPDATE auth.config SET value = 'false' WHERE parameter = 'email_confirm_changes';
UPDATE auth.config SET value = 'false' WHERE parameter = 'secure_email_change_enabled';

-- 3. Permitir signups
UPDATE auth.config SET value = 'true' WHERE parameter = 'enable_signup';
UPDATE auth.config SET value = 'true' WHERE parameter = 'enable_anonymous_sign_ins';

-- 4. Função para limpar usuários duplicados
CREATE OR REPLACE FUNCTION clean_duplicate_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remover profiles duplicados (manter o mais recente)
  DELETE FROM public.profiles WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
      FROM public.profiles
    ) t WHERE t.rn > 1
  );
  
  -- Remover user_roles duplicados
  DELETE FROM public.user_roles WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, role ORDER BY created_at DESC) as rn
      FROM public.user_roles
    ) t WHERE t.rn > 1
  );
END;
$$;

-- 5. Executar limpeza
SELECT clean_duplicate_users();

-- 6. Recriar trigger de signup SIMPLIFICADO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Inserir profile simples
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
  
  -- Inserir role simples
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'motoboy'::app_role)
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 7. Políticas mais permissivas TEMPORARIAMENTE
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO public
  WITH CHECK (true);

-- 8. Função para testar autenticação
CREATE OR REPLACE FUNCTION test_auth_system(test_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result TEXT := '';
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = test_email) THEN
    result := 'Email já existe';
  ELSE
    result := 'Email disponível';
  END IF;
  
  RETURN result;
END;
$$;
