-- ============================================
-- ATUALIZAR ENUM service_status
-- Adicionar novos status: collected, on_route, delivered
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. ADICIONAR NOVOS STATUS AO ENUM
DO $$
BEGIN
  -- Adicionar 'pending' (se não existir)
  BEGIN
    ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'pending';
    RAISE NOTICE '✅ Status "pending" adicionado';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ Status "pending" já existe';
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ pending: %', SQLERRM;
  END;

  -- Adicionar 'collected' (se não existir)
  BEGIN
    ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'collected';
    RAISE NOTICE '✅ Status "collected" adicionado';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ Status "collected" já existe';
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ collected: %', SQLERRM;
  END;

  -- Adicionar 'on_route' (se não existir)
  BEGIN
    ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'on_route';
    RAISE NOTICE '✅ Status "on_route" adicionado';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ Status "on_route" já existe';
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ on_route: %', SQLERRM;
  END;

  -- Adicionar 'delivered' (se não existir)
  BEGIN
    ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'delivered';
    RAISE NOTICE '✅ Status "delivered" adicionado';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ Status "delivered" já existe';
    WHEN OTHERS THEN
      RAISE NOTICE 'ℹ️ delivered: %', SQLERRM;
  END;
END $$;

-- 2. VERIFICAÇÃO
SELECT '=== VALORES DO ENUM service_status ===' AS info;
SELECT enumlabel as status, enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- Deve mostrar:
-- available
-- pending
-- accepted
-- collected
-- on_route
-- in_progress (pode manter se já existe)
-- delivered
-- completed (pode manter se já existe)
-- cancelled

SELECT '✅ ENUM ATUALIZADO COM SUCESSO!' AS resultado;
