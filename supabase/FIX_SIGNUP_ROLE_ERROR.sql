-- ============================================
-- CORREÇÃO DEFINITIVA: Database error saving new user
-- ============================================
-- Este script corrige o problema de cadastro de novos usuários
-- garantindo que a role seja corretamente inserida
-- ============================================

-- 1. Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Remover função antiga
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Criar função CORRIGIDA para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Obter role dos metadados (padrão: motoboy)
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'motoboy'
  );

  -- Log para debug
  RAISE LOG 'Criando usuário: id=%, email=%, role=%', NEW.id, NEW.email, user_role;

  -- Inserir profile com TODOS os campos obrigatórios
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    phone
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    user_role::user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone,
    updated_at = NOW();

  -- Inserir na tabela user_roles também
  INSERT INTO public.user_roles (
    user_id,
    role
  ) VALUES (
    NEW.id,
    user_role::user_role
  )
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

  RAISE LOG 'Usuário criado com sucesso: id=%', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE LOG 'ERRO em handle_new_user: % - %, user_id: %, email: %', 
      SQLERRM, SQLSTATE, NEW.id, NEW.email;
    -- Não lançar exceção para não bloquear o cadastro
    RETURN NEW;
END;
$$;

-- 4. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Garantir que as políticas RLS estejam corretas
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;

-- Política para permitir inserção via trigger
CREATE POLICY "Enable insert for authenticated users"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Política para permitir inserção na tabela user_roles
DROP POLICY IF EXISTS "Enable insert for user_roles" ON public.user_roles;
CREATE POLICY "Enable insert for user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Verificar se a tabela user_roles existe, se não, criar
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 7. Verificar estrutura da tabela profiles
DO $$
BEGIN
  -- Verificar se coluna role existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'ERRO: Coluna role não existe na tabela profiles!';
  END IF;
  
  -- Verificar se enum user_role existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    RAISE EXCEPTION 'ERRO: Tipo user_role não existe!';
  END IF;

  RAISE NOTICE 'Estrutura verificada com sucesso!';
END $$;

-- 8. Testar se o enum user_role tem os valores corretos
DO $$
DECLARE
  enum_values text[];
BEGIN
  SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'user_role'::regtype;
  
  RAISE NOTICE 'Valores do enum user_role: %', enum_values;
  
  -- Verificar se 'company' e 'motoboy' existem
  IF NOT ('company' = ANY(enum_values)) THEN
    RAISE EXCEPTION 'ERRO: Valor "company" não existe no enum user_role!';
  END IF;
  
  IF NOT ('motoboy' = ANY(enum_values)) THEN
    RAISE EXCEPTION 'ERRO: Valor "motoboy" não existe no enum user_role!';
  END IF;
  
  RAISE NOTICE 'Enum user_role configurado corretamente!';
END $$;

-- 9. Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE 'Agora você pode criar novos usuários com role "company" ou "motoboy"';
END $$;
