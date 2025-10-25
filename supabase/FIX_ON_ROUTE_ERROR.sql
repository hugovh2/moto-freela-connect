-- ============================================
-- CORREÇÃO URGENTE: Adicionar 'on_route' ao enum
-- ============================================
-- COPIE E COLE ESTE CÓDIGO NO SQL EDITOR DO SUPABASE
-- ============================================

-- Adicionar os status que faltam
DO $$
BEGIN
  -- Adicionar 'on_route'
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'on_route' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'on_route';
    RAISE NOTICE '✅ Status on_route adicionado';
  END IF;

  -- Adicionar 'delivered' também
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delivered' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'delivered';
    RAISE NOTICE '✅ Status delivered adicionado';
  END IF;

  -- Adicionar 'pending' também
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'pending';
    RAISE NOTICE '✅ Status pending adicionado';
  END IF;
END $$;

-- Verificar se foi adicionado
SELECT enumlabel as status_disponivel, enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;
