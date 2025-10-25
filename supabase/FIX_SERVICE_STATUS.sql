-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE STATUS
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que o enum service_status tem todos os valores
DO $$
BEGIN
  -- Adicionar 'pending' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'pending';
    RAISE NOTICE '✅ Status "pending" adicionado';
  END IF;

  -- Adicionar 'collected' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'collected' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'collected';
    RAISE NOTICE '✅ Status "collected" adicionado';
  END IF;

  -- Adicionar 'on_route' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'on_route' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'on_route';
    RAISE NOTICE '✅ Status "on_route" adicionado';
  END IF;

  -- Adicionar 'delivered' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delivered' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'delivered';
    RAISE NOTICE '✅ Status "delivered" adicionado';
  END IF;
END $$;

-- 2. Garantir que a tabela services tem todas as colunas necessárias
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;

-- 3. Garantir que a tabela transactions existe para o sistema de pagamento
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  description TEXT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Habilitar RLS na tabela transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Garantir que a tabela user_locations existe para rastreamento
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  is_available BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Habilitar RLS na tabela user_locations
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- 8. Políticas para user_locations
DROP POLICY IF EXISTS "Users can view own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can insert own location" ON public.user_locations;
DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;

CREATE POLICY "Users can view own location"
  ON public.user_locations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location"
  ON public.user_locations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location"
  ON public.user_locations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Verificar status disponíveis
SELECT '=== STATUS DISPONÍVEIS ===' AS info;
SELECT enumlabel as status, enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- 10. Verificar serviços existentes
SELECT '=== SERVIÇOS EXISTENTES ===' AS info;
SELECT status, COUNT(*) as quantidade
FROM public.services
GROUP BY status
ORDER BY quantidade DESC;
