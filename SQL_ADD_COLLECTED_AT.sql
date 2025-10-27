-- ========================================
-- Adicionar coluna collected_at
-- Cronômetro começa quando motoboy COLETA a entrega
-- ========================================

-- Adicionar coluna collected_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'collected_at'
    ) THEN
        ALTER TABLE services ADD COLUMN collected_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Coluna collected_at adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna collected_at já existe';
    END IF;
END $$;

-- Verificar
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name = 'collected_at';
