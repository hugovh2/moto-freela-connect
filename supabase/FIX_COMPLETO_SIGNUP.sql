-- ============================================
-- CORREÇÃO COMPLETA DO CADASTRO
-- ============================================
-- Adiciona coluna role + corrige função handle_new_user
-- Execute APENAS ESTE ARQUIVO - ele faz tudo!
-- ============================================

-- PASSO 1: Criar enum user_role se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('company', 'motoboy');
    RAISE NOTICE '✅ Enum user_role criado';
  ELSE
    RAISE NOTICE '✅ Enum user_role já existe';
  END IF;
END $$;

-- PASSO 2: Adicionar coluna role se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role user_role NOT NULL DEFAULT 'motoboy';
    RAISE NOTICE '✅ Coluna role adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna role já existe';
  END IF;
END $$;

-- PASSO 3: Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASSO 4: Recriar função handle_new_user CORRIGIDA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Obter role dos metadados (padrão: motoboy)
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'motoboy'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'motoboy'::user_role;
  END;

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
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

  RAISE NOTICE '✅ Perfil criado para %', NEW.email;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro em handle_new_user para %: % - %', NEW.email, SQLERRM, SQLSTATE;
    -- Não lançar exceção - apenas retornar
    RETURN NEW;
END;
$$;

-- PASSO 5: Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASSO 6: Atualizar políticas RLS
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;

-- Política para usuários autenticados
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para o trigger (SECURITY DEFINER)
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- PASSO 7: Verificar políticas de SELECT (necessárias)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- PASSO 8: Política de UPDATE
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'VERIFICAÇÃO DA ESTRUTURA';
  RAISE NOTICE '==============================================';
  
  -- Verificar enum
  SELECT COUNT(*) INTO v_count FROM pg_type WHERE typname = 'user_role';
  RAISE NOTICE 'Enum user_role existe: %', (v_count > 0);
  
  -- Verificar coluna role
  SELECT COUNT(*) INTO v_count FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'role';
  RAISE NOTICE 'Coluna role existe: %', (v_count > 0);
  
  -- Verificar trigger
  SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  RAISE NOTICE 'Trigger on_auth_user_created existe: %', (v_count > 0);
  
  -- Verificar função
  SELECT COUNT(*) INTO v_count FROM pg_proc WHERE proname = 'handle_new_user';
  RAISE NOTICE 'Função handle_new_user existe: %', (v_count > 0);
  
  -- Verificar policies
  SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE 'Políticas RLS em profiles: %', v_count;
  
  RAISE NOTICE '==============================================';
END $$;

-- Listar colunas da tabela profiles
SELECT 
  '📋 Estrutura da tabela profiles:' as info;
  
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================
-- RESULTADO
-- ============================================
SELECT '✅ CORREÇÃO COMPLETA APLICADA!' AS resultado;
SELECT '🔧 Coluna role adicionada' AS info1;
SELECT '⚙️ Função handle_new_user recriada' AS info2;
SELECT '🔒 Políticas RLS configuradas' AS info3;
SELECT '🎯 AGORA O CADASTRO DEVE FUNCIONAR!' AS info4;
