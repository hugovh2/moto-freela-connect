-- ============================================
-- FIX: Adicionar colunas faltantes em user_locations
-- Execute AGORA no SQL Editor
-- ============================================

-- 1. ADICIONAR COLUNAS FALTANTES (se não existirem)
ALTER TABLE public.user_locations 
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(10, 2);

ALTER TABLE public.user_locations 
ADD COLUMN IF NOT EXISTS speed DECIMAL(10, 2);

ALTER TABLE public.user_locations 
ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2);

-- 2. RECRIAR FUNÇÃO UPSERT COM TODAS AS COLUNAS
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

-- 3. VERIFICAÇÃO
SELECT '=== ESTRUTURA DA TABELA ===' AS info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_locations'
ORDER BY ordinal_position;

-- Deve mostrar:
-- id          | uuid
-- user_id     | uuid
-- latitude    | numeric
-- longitude   | numeric
-- accuracy    | numeric
-- speed       | numeric
-- heading     | numeric
-- updated_at  | timestamp with time zone
-- created_at  | timestamp with time zone

SELECT '✅ COLUNAS ADICIONADAS! Recarregue o app e teste.' AS resultado;
