-- Adicionar colunas de distância e tempo estimado na tabela services
-- Data: 2025-10-26

-- Adicionar coluna distance_km (distância em quilômetros)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);

-- Adicionar coluna estimated_time_minutes (tempo estimado em minutos)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;

-- Adicionar comentários para documentação
COMMENT ON COLUMN services.distance_km IS 'Distância calculada entre origem e destino em quilômetros';
COMMENT ON COLUMN services.estimated_time_minutes IS 'Tempo estimado de entrega em minutos (baseado em 30 km/h)';

-- Criar índice para melhorar performance de queries por distância
CREATE INDEX IF NOT EXISTS idx_services_distance 
ON services(distance_km) 
WHERE distance_km IS NOT NULL;

-- Criar índice para melhorar performance de queries por tempo estimado
CREATE INDEX IF NOT EXISTS idx_services_estimated_time 
ON services(estimated_time_minutes) 
WHERE estimated_time_minutes IS NOT NULL;
