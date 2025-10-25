-- ============================================
-- CORREÇÃO: Database error finding user
-- ============================================
-- Problema: handle_new_user() não insere o campo 'role' 
-- que é obrigatório na tabela profiles
-- ============================================

-- 1. Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Recriar função handle_new_user CORRIGIDA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role user_role;
BEGIN
  -- Obter role dos metadados (padrão: motoboy)
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'motoboy'::user_role
  );

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
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = EXCLUDED.phone;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log detalhado do erro
    RAISE LOG 'Erro em handle_new_user: % - %', SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Falha ao criar perfil: %', SQLERRM;
END;
$$;

-- 3. Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar políticas RLS de INSERT em profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política adicional para o SECURITY DEFINER function
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Garantir que a coluna role existe e está correta
DO $$
BEGIN
  -- Verificar se coluna role existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    RAISE EXCEPTION 'Coluna role não existe na tabela profiles!';
  END IF;
  
  -- Verificar se enum user_role existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    RAISE EXCEPTION 'Enum user_role não existe!';
  END IF;
  
  RAISE NOTICE '✅ Estrutura da tabela profiles está correta';
END $$;

-- 6. Teste a função manualmente (opcional - descomente para testar)
-- SELECT public.handle_new_user() FROM auth.users LIMIT 1;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  'Trigger' as componente,
  EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) as existe
UNION ALL
SELECT 
  'Função handle_new_user' as componente,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user'
  ) as existe
UNION ALL
SELECT 
  'Policy INSERT profiles' as componente,
  EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname LIKE '%insert%'
  ) as existe;

-- ============================================
-- RESULTADO
-- ============================================
SELECT '✅ CORREÇÃO APLICADA!' AS resultado;
SELECT '📝 Trigger handle_new_user recriado com campo role' AS info;
SELECT '🔒 Policies RLS atualizadas' AS info;
SELECT '🎯 Agora o cadastro deve funcionar!' AS info;
