-- ========================================
-- SQL LIMPO - Adicionar Colunas Distance e Time
-- Execute este SQL no Supabase Dashboard
-- ========================================

-- 1. Adicionar coluna distance_km (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'distance_km'
    ) THEN
        ALTER TABLE services ADD COLUMN distance_km DECIMAL(10, 2);
        RAISE NOTICE 'Coluna distance_km adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna distance_km já existe';
    END IF;
END $$;

-- 2. Adicionar coluna estimated_time_minutes (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'estimated_time_minutes'
    ) THEN
        ALTER TABLE services ADD COLUMN estimated_time_minutes INTEGER;
        RAISE NOTICE 'Coluna estimated_time_minutes adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna estimated_time_minutes já existe';
    END IF;
END $$;

-- 3. Verificar resultado
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name IN ('distance_km', 'estimated_time_minutes')
ORDER BY column_name;

-- ========================================
-- RESULTADO ESPERADO:
-- distance_km              | numeric       | YES
-- estimated_time_minutes   | integer       | YES
-- ========================================
