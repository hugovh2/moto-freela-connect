-- ============================================
-- LIMPAR ABSOLUTAMENTE TODOS OS DADOS
-- ============================================
-- ⚠️⚠️⚠️ ATENÇÃO: APAGA TUDO SEM EXCEÇÃO! ⚠️⚠️⚠️
-- ⚠️ Inclui TODOS os usuários de autenticação
-- ⚠️ Limpa TODAS as tabelas do sistema
-- ⚠️ As estruturas permanecem, apenas dados são apagados
-- ⚠️ Execute apenas se tiver 100% de certeza!
-- ============================================

-- Desabilitar triggers e constraints temporariamente
SET session_replication_role = replica;
SET CONSTRAINTS ALL DEFERRED;

-- ============================================
-- LIMPAR TABELAS (na ordem correta para respeitar foreign keys)
-- ============================================

DO $$ 
BEGIN
  -- 1. Limpar mensagens (dependem de services e profiles)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    TRUNCATE TABLE public.messages CASCADE;
    RAISE NOTICE '✅ Tabela messages limpa';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
    TRUNCATE TABLE public.chat_messages CASCADE;
    RAISE NOTICE '✅ Tabela chat_messages limpa';
  END IF;

  -- 2. Limpar avaliações (dependem de services e profiles)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ratings') THEN
    TRUNCATE TABLE public.ratings CASCADE;
    RAISE NOTICE '✅ Tabela ratings limpa';
  END IF;

  -- 3. Limpar histórico de localização (depende de profiles e services)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'location_history') THEN
    TRUNCATE TABLE public.location_history CASCADE;
    RAISE NOTICE '✅ Tabela location_history limpa';
  END IF;

  -- 4. Limpar transações (dependem de services e users)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    TRUNCATE TABLE public.transactions CASCADE;
    RAISE NOTICE '✅ Tabela transactions limpa';
  END IF;

  -- 5. Limpar localizações de usuários (depende de users)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_locations') THEN
    TRUNCATE TABLE public.user_locations CASCADE;
    RAISE NOTICE '✅ Tabela user_locations limpa';
  END IF;

  -- 6. Limpar roles de usuários (depende de users)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
    TRUNCATE TABLE public.user_roles CASCADE;
    RAISE NOTICE '✅ Tabela user_roles limpa';
  END IF;

  -- 7. Limpar serviços (depende de profiles)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
    TRUNCATE TABLE public.services CASCADE;
    RAISE NOTICE '✅ Tabela services limpa';
  END IF;

  -- 8. Limpar perfis (depende de auth.users)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    TRUNCATE TABLE public.profiles CASCADE;
    RAISE NOTICE '✅ Tabela profiles limpa';
  END IF;
  
END $$;

-- ============================================
-- LIMPAR AUTH.USERS (USUÁRIOS DE AUTENTICAÇÃO)
-- ============================================
-- IMPORTANTE: Fazer isso SEPARADAMENTE para garantir limpeza total
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar quantos usuários existem
  SELECT COUNT(*) INTO v_count FROM auth.users;
  RAISE NOTICE '🔍 Encontrados % usuários em auth.users', v_count;
  
  -- Deletar TODOS os usuários
  DELETE FROM auth.users;
  
  -- Confirmar
  SELECT COUNT(*) INTO v_count FROM auth.users;
  IF v_count = 0 THEN
    RAISE NOTICE '✅ TODOS os usuários de autenticação removidos!';
    RAISE NOTICE '📧 Agora você pode cadastrar com QUALQUER email!';
  ELSE
    RAISE WARNING '⚠️ Ainda existem % usuários!', v_count;
  END IF;
END $$;

-- Reabilitar triggers
SET session_replication_role = DEFAULT;

-- ============================================
-- VERIFICAÇÃO (Lista apenas tabelas que existem e seus totais)
-- ============================================
DO $$
DECLARE
  r RECORD;
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE 'CONTAGEM DE REGISTROS POR TABELA';
  RAISE NOTICE '======================================';
  
  -- Verificar auth.users primeiro
  SELECT COUNT(*) INTO v_count FROM auth.users;
  RAISE NOTICE '% - % registros', RPAD('auth.users', 25), v_count;
  
  -- Verificar tabelas públicas
  FOR r IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name IN (
        'messages', 
        'ratings', 
        'location_history', 
        'transactions', 
        'user_locations', 
        'user_roles', 
        'services', 
        'profiles'
      )
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM public.%I', r.table_name) INTO v_count;
    RAISE NOTICE '% - % registros', RPAD(r.table_name, 25), v_count;
  END LOOP;
  
  RAISE NOTICE '======================================';
END $$;

-- ============================================
-- RESULTADO FINAL
-- ============================================
SELECT '✅✅✅ BANCO DE DADOS COMPLETAMENTE LIMPO! ✅✅✅' AS resultado;

-- Mostrar contagens finais (TODAS devem ser 0)
SELECT 
  'RESUMO FINAL' AS secao,
  (SELECT COUNT(*) FROM auth.users) AS usuarios_auth,
  (SELECT COUNT(*) FROM public.profiles) AS profiles,
  (SELECT COUNT(*) FROM public.services) AS services,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = 0 
      AND (SELECT COUNT(*) FROM public.profiles) = 0 
      AND (SELECT COUNT(*) FROM public.services) = 0
    THEN '🎉 TUDO ZERADO - PRONTO PARA NOVOS CADASTROS!'
    ELSE '⚠️ AINDA EXISTEM DADOS - VERIFIQUE!'
  END AS status;

SELECT '' AS separador;
SELECT '📋 Estruturas das tabelas: INTACTAS' AS info;
SELECT '🔒 Policies RLS: ATIVAS' AS info;
SELECT '⚡ Funções e triggers: PRESERVADOS' AS info;
SELECT '📧 Pode cadastrar com QUALQUER email agora!' AS info;
