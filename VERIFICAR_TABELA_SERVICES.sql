-- ========================================
-- VERIFICAR ESTRUTURA DA TABELA SERVICES
-- Execute este SQL primeiro para ver o estado atual
-- ========================================

-- 1. Ver todas as colunas da tabela services
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'services'
ORDER BY ordinal_position;

-- 2. Verificar especificamente se distance_km e estimated_time_minutes existem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'distance_km'
        ) THEN '✅ distance_km EXISTS'
        ELSE '❌ distance_km NOT FOUND'
    END as distance_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'services' AND column_name = 'estimated_time_minutes'
        ) THEN '✅ estimated_time_minutes EXISTS'
        ELSE '❌ estimated_time_minutes NOT FOUND'
    END as time_status;

-- 3. Ver exemplo de dados (últimos 5 serviços)
SELECT 
    id,
    title,
    distance_km,
    estimated_time_minutes,
    status,
    created_at
FROM services
ORDER BY created_at DESC
LIMIT 5;
