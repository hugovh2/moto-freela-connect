-- ============================================
-- CORREÇÃO COMPLETA DE TODOS OS PROBLEMAS
-- ============================================

-- 1. ADICIONAR STATUS 'collected' AO ENUM
DO $$ 
BEGIN
  -- Verificar se o enum existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_status') THEN
    -- Adicionar 'collected' se não existir
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'collected' 
      AND enumtypid = 'service_status'::regtype
    ) THEN
      ALTER TYPE service_status ADD VALUE 'collected';
      RAISE NOTICE 'Status "collected" adicionado';
    ELSE
      RAISE NOTICE 'Status "collected" já existe';
    END IF;
  ELSE
    RAISE NOTICE 'Enum service_status não existe - criando...';
    CREATE TYPE service_status AS ENUM (
      'available',
      'accepted',
      'collected',
      'in_progress',
      'completed',
      'cancelled'
    );
  END IF;
END $$;

-- 2. CORRIGIR POLÍTICAS DE STORAGE PARA FOTOS
-- Remover políticas antigas
DROP POLICY IF EXISTS "Authenticated users can upload service photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view service photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;

-- Criar políticas corretas
CREATE POLICY "Anyone authenticated can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-photos'
);

CREATE POLICY "Anyone can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'service-photos');

CREATE POLICY "Users can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 3. ADICIONAR COLUNA DE DISTÂNCIA E TEMPO ESTIMADO
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;

-- 4. FUNÇÃO PARA CALCULAR DISTÂNCIA (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL, 
  lat2 DECIMAL, 
  lon2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- km
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat / 2) * SIN(dlat / 2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dlon / 2) * SIN(dlon / 2);
  
  c := 2 * ATAN2(SQRT(a), SQRT(1 - a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. FUNÇÃO PARA ESTIMAR TEMPO DE ENTREGA
CREATE OR REPLACE FUNCTION estimate_delivery_time(distance_km DECIMAL)
RETURNS INTEGER AS $$
DECLARE
  avg_speed DECIMAL := 30; -- km/h velocidade média de moto na cidade
  base_time INTEGER := 10; -- minutos de tempo base (preparação, espera, etc)
  travel_time DECIMAL;
BEGIN
  -- Calcular tempo de viagem em minutos
  travel_time := (distance_km / avg_speed) * 60;
  
  -- Retornar tempo total arredondado
  RETURN CEIL(base_time + travel_time);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. TRIGGER PARA CALCULAR DISTÂNCIA E TEMPO AO ACEITAR
CREATE OR REPLACE FUNCTION calculate_service_metrics()
RETURNS TRIGGER AS $$
DECLARE
  distance DECIMAL;
  eta INTEGER;
BEGIN
  -- Calcular apenas quando status muda para 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'available' THEN
    -- Calcular distância se coordenadas existirem
    IF NEW.pickup_lat IS NOT NULL AND NEW.pickup_lng IS NOT NULL AND
       NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL THEN
      
      distance := calculate_distance(
        NEW.pickup_lat,
        NEW.pickup_lng,
        NEW.delivery_lat,
        NEW.delivery_lng
      );
      
      eta := estimate_delivery_time(distance);
      
      NEW.distance_km := distance;
      NEW.estimated_time_minutes := eta;
      
      RAISE NOTICE 'Distância calculada: % km, Tempo estimado: % minutos', distance, eta;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_calculate_service_metrics ON services;
CREATE TRIGGER trigger_calculate_service_metrics
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION calculate_service_metrics();

-- 7. VERIFICAR ESTRUTURA DA TABELA SERVICES
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

-- 8. VERIFICAR VALORES DO ENUM
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- 9. VERIFICAR POLÍTICAS DE STORAGE
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage'
ORDER BY policyname;

-- ============================================
-- FIM DA CORREÇÃO
-- ============================================

SELECT 'Todas as correções aplicadas com sucesso!' as status;
