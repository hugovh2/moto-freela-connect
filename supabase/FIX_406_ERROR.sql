-- ============================================
-- CORREÇÃO ERRO 406 - EXECUTE AGORA
-- ============================================

-- 1. VERIFICAR SE TABELA EXISTE
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user_locations'
    ) 
    THEN '✅ Tabela user_locations existe'
    ELSE '❌ Tabela user_locations NÃO existe - será criada agora'
  END as status;

-- 2. CRIAR TABELA (se não existir)
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

-- 3. GARANTIR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at ON public.user_locations(updated_at);

-- 4. HABILITAR RLS
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "users_insert_own_location" ON public.user_locations;
DROP POLICY IF EXISTS "users_update_own_location" ON public.user_locations;
DROP POLICY IF EXISTS "anyone_can_view_locations" ON public.user_locations;

-- 6. CRIAR POLÍTICAS SIMPLES E PERMISSIVAS

-- Qualquer autenticado pode inserir/atualizar sua própria localização
CREATE POLICY "users_insert_own_location"
ON public.user_locations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_location"
ON public.user_locations FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- IMPORTANTE: Permitir SELECT para todos autenticados (para rastreamento)
CREATE POLICY "anyone_can_view_locations"
ON public.user_locations FOR SELECT
TO authenticated
USING (true);

-- 7. CRIAR OU SUBSTITUIR FUNÇÃO DE UPSERT
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

-- 8. VERIFICAÇÃO FINAL
SELECT '=== VERIFICAÇÃO FINAL ===' AS info;

-- Verificar tabela
SELECT 
  'user_locations' as tabela,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_locations'
  ) THEN '✅ Existe' ELSE '❌ Não existe' END as status;

-- Verificar políticas
SELECT '=== POLÍTICAS RLS ===' AS info;
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_locations'
ORDER BY policyname;

-- Verificar função
SELECT '=== FUNÇÃO UPSERT ===' AS info;
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'upsert_user_location'
  ) THEN '✅ Função existe' ELSE '❌ Função não existe' END as status;

-- Resultado
SELECT '✅ CORREÇÃO COMPLETA! Recarregue o app e teste novamente.' as resultado;
