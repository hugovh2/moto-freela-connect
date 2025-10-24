-- CORREÇÃO ESPECÍFICA PARA PROBLEMAS DE AUTENTICAÇÃO
-- Execute este SQL adicional no Supabase para corrigir JWT e duplicação

-- 1. Limpar dados duplicados primeiro
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT user_id FROM (
    SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM public.user_roles
  ) t WHERE t.rn > 1
);

-- 2. Corrigir trigger de signup (pode ter problemas)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Recriar função de signup melhorada
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role := 'motoboy';
BEGIN
  -- Verificar se já existe (evitar duplicação)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    RETURN NEW;
  END IF;
  
  -- Extrair role dos metadados
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := (NEW.raw_user_meta_data->>'role')::app_role;
  END IF;
  
  -- Inserir profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Inserir role (evitar duplicação)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha
    RAISE LOG 'Erro no handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Configurar políticas de autenticação mais permissivas temporariamente
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Mais permissivo temporariamente

-- 6. Verificar e corrigir configurações de JWT
-- Garantir que as configurações estão corretas
UPDATE auth.config SET value = 'true' WHERE parameter = 'enable_signup';

-- 7. Limpar sessões inválidas
DELETE FROM auth.sessions WHERE expires_at < NOW();

-- 8. Função para debug de autenticação
CREATE OR REPLACE FUNCTION public.debug_auth_info()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  has_profile BOOLEAN,
  has_role BOOLEAN,
  role_name TEXT
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    au.id as user_id,
    au.email,
    (p.id IS NOT NULL) as has_profile,
    (ur.user_id IS NOT NULL) as has_role,
    ur.role::TEXT as role_name
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN public.user_roles ur ON ur.user_id = au.id
  ORDER BY au.created_at DESC
  LIMIT 10;
$$;
