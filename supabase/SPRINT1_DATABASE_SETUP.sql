-- ============================================
-- SPRINT 1 - CONFIGURAÇÃO DE BANCO DE DADOS
-- ============================================

-- 1. CRIAR BUCKET PARA FOTOS DE SERVIÇOS
-- Execute no dashboard do Supabase: Storage > Create new bucket
-- Nome: service-photos
-- Public: true

-- Ou via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-photos', 'service-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE
-- Permitir usuários autenticados fazerem upload
CREATE POLICY "Authenticated users can upload service photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-photos');

-- Permitir leitura pública das fotos
CREATE POLICY "Public can view service photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'service-photos');

-- Permitir dono deletar suas fotos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'service-photos');

-- 3. ADICIONAR COLUNAS DE TIMESTAMPS EM SERVICES
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ;

-- Adicionar coluna para URL da foto
ALTER TABLE services
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 4. HABILITAR REALTIME PARA MESSAGES
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 5. HABILITAR REALTIME PARA USER_LOCATIONS
ALTER TABLE user_locations REPLICA IDENTITY FULL;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_messages_service_id 
ON messages(service_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id 
ON user_locations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_locations_updated_at 
ON user_locations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_services_status 
ON services(status);

CREATE INDEX IF NOT EXISTS idx_services_motoboy_id 
ON services(motoboy_id) WHERE motoboy_id IS NOT NULL;

-- 7. FUNÇÃO PARA ATUALIZAR TIMESTAMP AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_service_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar updated_at sempre
  NEW.updated_at = NOW();
  
  -- Adicionar timestamps específicos por status
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    NEW.accepted_at = NOW();
  END IF;
  
  IF NEW.status = 'collected' AND OLD.status != 'collected' THEN
    NEW.collected_at = NOW();
  END IF;
  
  IF NEW.status = 'in_progress' AND OLD.status != 'in_progress' THEN
    NEW.in_progress_at = NOW();
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_service_timestamps ON services;
CREATE TRIGGER trigger_update_service_timestamps
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_service_timestamps();

-- 8. ADICIONAR NOVOS STATUS SE NECESSÁRIO
-- Verificar se os enums existem
DO $$ 
BEGIN
  -- Adicionar 'collected' se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'collected' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'collected';
  END IF;
END $$;

-- 9. FUNÇÃO PARA LIMPAR MENSAGENS ANTIGAS (OPCIONAL)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 10. VERIFICAR CONFIGURAÇÕES
SELECT 
  'messages' as table_name,
  COUNT(*) as total_rows,
  MAX(created_at) as latest_message
FROM messages
UNION ALL
SELECT 
  'user_locations' as table_name,
  COUNT(*) as total_rows,
  MAX(updated_at) as latest_update
FROM user_locations
UNION ALL
SELECT 
  'services' as table_name,
  COUNT(*) as total_rows,
  MAX(updated_at) as latest_update
FROM services;

-- 11. HABILITAR REALTIME NO PAINEL SUPABASE
-- Vá em: Database > Replication
-- Habilite para as tabelas:
-- - messages
-- - user_locations
-- - services

-- 12. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON COLUMN services.accepted_at IS 'Timestamp quando o serviço foi aceito pelo motoboy';
COMMENT ON COLUMN services.collected_at IS 'Timestamp quando o item foi coletado';
COMMENT ON COLUMN services.in_progress_at IS 'Timestamp quando iniciou a entrega';
COMMENT ON COLUMN services.photo_url IS 'URL da foto da entrega (Supabase Storage)';

-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================

-- VERIFICAÇÃO FINAL
SELECT 
  'Setup completo!' as status,
  NOW() as executed_at;
