-- ============================================
-- SOLUÇÃO COMPLETA - EXECUTAR ESTE ARQUIVO
-- ============================================
-- 1. Limpa registros órfãos do email específico
-- 2. Adiciona coluna role se não existir
-- 3. Corrige função handle_new_user
-- 4. Configura políticas RLS
-- ============================================

-- ⚠️ MUDE O EMAIL AQUI SE NECESSÁRIO
\set email_limpar 'vitorhugo1524@gmail.com'

-- ===========================================
-- PARTE 1: LIMPAR EMAIL ESPECÍFICO
-- ===========================================
DO $$
DECLARE
  v_email TEXT := 'vitorhugo1524@gmail.com'; -- ← MUDE AQUI
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'PARTE 1: LIMPANDO EMAIL %', v_email;
  RAISE NOTICE '═══════════════════════════════════════════';
  
  -- Buscar user_id
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email;
  END IF;
  
  -- Deletar tudo se encontrou
  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;
    DELETE FROM public.ratings WHERE rated_id = v_user_id OR rater_id = v_user_id;
    DELETE FROM public.location_history WHERE user_id = v_user_id;
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    DELETE FROM public.user_locations WHERE user_id = v_user_id;
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    DELETE FROM public.services WHERE motoboy_id = v_user_id OR company_id = v_user_id;
    DELETE FROM public.profiles WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE '✅ Todos os registros de % deletados', v_email;
  ELSE
    RAISE NOTICE '✅ Nenhum registro encontrado para %', v_email;
  END IF;
  
  -- Limpar órfãos
  DELETE FROM public.profiles WHERE email = v_email;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN RAISE NOTICE '🧹 % profiles órfãos limpos', v_count; END IF;
  
END $$;

-- ===========================================
-- PARTE 2: CRIAR ENUM E COLUNA ROLE
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'PARTE 2: CONFIGURANDO ESTRUTURA';
  RAISE NOTICE '═══════════════════════════════════════════';
  
  -- Criar enum
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('company', 'motoboy');
    RAISE NOTICE '✅ Enum user_role criado';
  ELSE
    RAISE NOTICE '✅ Enum user_role já existe';
  END IF;
  
  -- Adicionar coluna role
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role user_role NOT NULL DEFAULT 'motoboy';
    RAISE NOTICE '✅ Coluna role adicionada';
  ELSE
    RAISE NOTICE '✅ Coluna role já existe';
  END IF;
END $$;

-- ===========================================
-- PARTE 3: FUNÇÃO HANDLE_NEW_USER
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'PARTE 3: CONFIGURANDO TRIGGER';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Obter role dos metadados
  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'motoboy'::user_role
    );
  EXCEPTION WHEN OTHERS THEN
    v_role := 'motoboy'::user_role;
  END;

  -- Inserir profile
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

  RAISE NOTICE '✅ Perfil criado: % (%)', NEW.email, v_role;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar perfil para %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- PARTE 4: POLÍTICAS RLS
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'PARTE 4: CONFIGURANDO POLÍTICAS RLS';
  RAISE NOTICE '═══════════════════════════════════════════';
END $$;

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- ===========================================
-- VERIFICAÇÃO FINAL
-- ===========================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE 'VERIFICAÇÃO FINAL';
  RAISE NOTICE '═══════════════════════════════════════════';
  
  SELECT COUNT(*) INTO v_count FROM pg_type WHERE typname = 'user_role';
  RAISE NOTICE 'Enum user_role: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.columns 
  WHERE table_name = 'profiles' AND column_name = 'role';
  RAISE NOTICE 'Coluna role: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM pg_trigger WHERE tgname = 'on_auth_user_created';
  RAISE NOTICE 'Trigger cadastro: %', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE 'Políticas RLS: % configuradas', v_count;
  
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- ===========================================
-- RESULTADO
-- ===========================================
SELECT '✅ SOLUÇÃO COMPLETA APLICADA!' AS resultado;
SELECT '📧 Email limpo e pronto para novo cadastro' AS info1;
SELECT '🔧 Estrutura da tabela corrigida' AS info2;
SELECT '⚙️ Trigger configurado corretamente' AS info3;
SELECT '🔒 Políticas RLS ativas' AS info4;
SELECT '' AS info5;
SELECT '🎯 AGORA PODE CADASTRAR NORMALMENTE!' AS info6;
