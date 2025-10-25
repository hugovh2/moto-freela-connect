-- ============================================
-- CORREÇÃO: Realtime e Rastreamento
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. CRIAR TABELA user_locations PARA RASTREAMENTO
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. ÍNDICE PARA BUSCA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

-- 3. HABILITAR RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS user_locations

-- Qualquer um autenticado pode inserir/atualizar sua própria localização
DROP POLICY IF EXISTS "users_insert_own_location" ON public.user_locations;
CREATE POLICY "users_insert_own_location"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_location" ON public.user_locations;
CREATE POLICY "users_update_own_location"
ON public.user_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Qualquer um pode ver localizações (para rastreamento)
DROP POLICY IF EXISTS "anyone_can_view_locations" ON public.user_locations;
CREATE POLICY "anyone_can_view_locations"
ON public.user_locations FOR SELECT
TO authenticated
USING (true);

-- 5. FUNÇÃO PARA UPSERT LOCATION
CREATE OR REPLACE FUNCTION public.upsert_user_location(
  p_user_id UUID,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_accuracy DECIMAL DEFAULT NULL,
  p_speed DECIMAL DEFAULT NULL,
  p_heading DECIMAL DEFAULT NULL
)
RETURNS public.user_locations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_location public.user_locations;
BEGIN
  INSERT INTO public.user_locations (
    user_id, latitude, longitude, accuracy, speed, heading, updated_at
  )
  VALUES (
    p_user_id, p_latitude, p_longitude, p_accuracy, p_speed, p_heading, NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    accuracy = EXCLUDED.accuracy,
    speed = EXCLUDED.speed,
    heading = EXCLUDED.heading,
    updated_at = NOW()
  RETURNING * INTO v_location;
  
  RETURN v_location;
END;
$$;

-- 6. HABILITAR REALTIME PARA TABELAS NECESSÁRIAS (ignora se já existir)
DO $$
BEGIN
  -- Adicionar messages
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    RAISE NOTICE '✅ Realtime habilitado para messages';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ messages já tem Realtime habilitado';
  END;

  -- Adicionar user_locations
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;
    RAISE NOTICE '✅ Realtime habilitado para user_locations';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ user_locations já tem Realtime habilitado';
  END;

  -- Adicionar services
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    RAISE NOTICE '✅ Realtime habilitado para services';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE '✅ services já tem Realtime habilitado';
  END;
END $$;

-- 7. VERIFICAÇÕES
SELECT '=== TABELA user_locations ===' AS info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_locations'
) AS tabela_existe;

SELECT '=== POLÍTICAS RLS user_locations ===' AS info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_locations'
ORDER BY policyname;

SELECT '=== REALTIME HABILITADO ===' AS info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'user_locations', 'services');

SELECT '✅ REALTIME CONFIGURADO COM SUCESSO!' AS resultado;
