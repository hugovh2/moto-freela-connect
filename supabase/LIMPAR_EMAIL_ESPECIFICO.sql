-- ============================================
-- LIMPAR EMAIL ESPECÍFICO COMPLETAMENTE
-- ============================================
-- Remove TODOS os vestígios de um email do sistema
-- Use isso quando precisar "resetar" um email específico
-- ============================================

-- ⚠️ SUBSTITUA O EMAIL ABAIXO PELO EMAIL QUE DESEJA LIMPAR
DO $$
DECLARE
  v_email TEXT := 'vitorhugo1524@gmail.com'; -- ← MUDE AQUI
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '🔍 Procurando registros para: %', v_email;
  RAISE NOTICE '';
  
  -- 1. Buscar user_id do auth.users (se existir)
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '✅ Usuário encontrado em auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE '⚠️ Usuário NÃO encontrado em auth.users';
    -- Buscar em profiles por email
    SELECT id INTO v_user_id FROM public.profiles WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
      RAISE NOTICE '⚠️ Mas existe profile órfão: %', v_user_id;
    END IF;
  END IF;
  
  -- 2. Deletar de todas as tabelas relacionadas (se user_id foi encontrado)
  IF v_user_id IS NOT NULL THEN
    
    -- Messages
    DELETE FROM public.messages WHERE sender_id = v_user_id OR receiver_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Messages deletadas: %', v_count; END IF;
    
    -- Ratings
    DELETE FROM public.ratings WHERE rated_id = v_user_id OR rater_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Ratings deletadas: %', v_count; END IF;
    
    -- Location History
    DELETE FROM public.location_history WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Location history deletado: %', v_count; END IF;
    
    -- Transactions
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Transactions deletadas: %', v_count; END IF;
    
    -- User Locations
    DELETE FROM public.user_locations WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ User locations deletadas: %', v_count; END IF;
    
    -- User Roles
    DELETE FROM public.user_roles WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ User roles deletadas: %', v_count; END IF;
    
    -- Services (como motoboy)
    DELETE FROM public.services WHERE motoboy_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Services (motoboy) deletados: %', v_count; END IF;
    
    -- Services (como company)
    DELETE FROM public.services WHERE company_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Services (company) deletados: %', v_count; END IF;
    
    -- Profiles
    DELETE FROM public.profiles WHERE id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Profile deletado: %', v_count; END IF;
    
    -- Auth Users (ÚLTIMO!)
    DELETE FROM auth.users WHERE id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count > 0 THEN RAISE NOTICE '🗑️ Auth user deletado: %', v_count; END IF;
    
  END IF;
  
  -- 3. Limpar qualquer registro órfão por email
  DELETE FROM public.profiles WHERE email = v_email AND id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN 
    RAISE NOTICE '🧹 Profiles órfãos limpos: %', v_count; 
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ EMAIL COMPLETAMENTE LIMPO: %', v_email;
  RAISE NOTICE '📧 Agora você pode cadastrar novamente com este email!';
  
END $$;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  '🔍 Verificando se ainda existe algum registro...' as info;

-- Verificar auth.users
SELECT 
  'auth.users' as tabela,
  COUNT(*) as registros
FROM auth.users 
WHERE email = 'vitorhugo1524@gmail.com'  -- ← MUDE AQUI TAMBÉM
UNION ALL
-- Verificar profiles
SELECT 
  'profiles' as tabela,
  COUNT(*) as registros
FROM public.profiles 
WHERE email = 'vitorhugo1524@gmail.com'  -- ← MUDE AQUI TAMBÉM
UNION ALL
-- Verificar services
SELECT 
  'services' as tabela,
  COUNT(*) as registros
FROM public.services 
WHERE company_id IN (
  SELECT id FROM public.profiles WHERE email = 'vitorhugo1524@gmail.com'  -- ← MUDE AQUI TAMBÉM
)
OR motoboy_id IN (
  SELECT id FROM public.profiles WHERE email = 'vitorhugo1524@gmail.com'  -- ← MUDE AQUI TAMBÉM
);

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todas as contagens devem ser 0 (zero)
-- ============================================
