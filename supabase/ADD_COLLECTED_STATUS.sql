-- ADICIONAR STATUS 'collected' AO ENUM service_status
-- Execute este SQL no SQL Editor do Supabase

-- Método 1: Tentar adicionar diretamente
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'collected' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
  ) THEN
    ALTER TYPE service_status ADD VALUE 'collected' AFTER 'accepted';
    RAISE NOTICE 'Status "collected" adicionado com sucesso!';
  ELSE
    RAISE NOTICE 'Status "collected" já existe';
  END IF;
END $$;

-- Verificar se foi adicionado
SELECT enumlabel, enumsortorder 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'service_status')
ORDER BY enumsortorder;

-- Se der erro, use este método alternativo:
-- ALTER TYPE service_status ADD VALUE IF NOT EXISTS 'collected' AFTER 'accepted';
