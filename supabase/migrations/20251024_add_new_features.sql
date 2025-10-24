-- Migration: Add New Features (Ratings, Chat, Gamification, Documents)
-- Version: 2.0.0
-- Date: 2025-10-24
-- Description: Adiciona tabelas e campos para as novas funcionalidades

-- ============================================================================
-- 1. TABELA DE AVALIAÇÕES (RATINGS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rater_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rater_role TEXT CHECK (rater_role IN ('company', 'motoboy')),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ratings_service ON ratings(service_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_user ON ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at DESC);

-- Comentários
COMMENT ON TABLE ratings IS 'Sistema de avaliação entre empresas e motoboys';
COMMENT ON COLUMN ratings.rating IS 'Avaliação de 1 a 5 estrelas';
COMMENT ON COLUMN ratings.tags IS 'Tags rápidas (ex: Pontual, Educado, etc)';

-- ============================================================================
-- 2. TABELA DE MENSAGENS DO CHAT
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_service ON chat_messages(service_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_unread ON chat_messages(read) WHERE read = FALSE;

-- Comentários
COMMENT ON TABLE chat_messages IS 'Mensagens de chat em tempo real entre empresa e motoboy';
COMMENT ON COLUMN chat_messages.read IS 'Indica se a mensagem foi lida pelo destinatário';

-- ============================================================================
-- 3. ADICIONAR CAMPOS DE GAMIFICAÇÃO E DOCUMENTOS AO PROFILES
-- ============================================================================

-- Campos de Gamificação
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 CHECK (level >= 1);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0 CHECK (experience >= 0);

-- Campos de Documentos
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cnh_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crlv_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_verified_at TIMESTAMP WITH TIME ZONE;

-- Comentários
COMMENT ON COLUMN profiles.badges IS 'Array de IDs dos badges conquistados';
COMMENT ON COLUMN profiles.level IS 'Nível do motoboy no sistema de gamificação';
COMMENT ON COLUMN profiles.experience IS 'Pontos de experiência (XP) acumulados';
COMMENT ON COLUMN profiles.cnh_url IS 'URL da foto da CNH no Supabase Storage';
COMMENT ON COLUMN profiles.crlv_url IS 'URL da foto do CRLV no Supabase Storage';
COMMENT ON COLUMN profiles.selfie_url IS 'URL da selfie com documento';
COMMENT ON COLUMN profiles.vehicle_photo_url IS 'URL da foto do veículo';
COMMENT ON COLUMN profiles.documents_verified IS 'Indica se os documentos foram verificados pela equipe';

-- ============================================================================
-- 4. HABILITAR REALTIME PARA CHAT
-- ============================================================================

-- Habilitar Realtime para a tabela de chat
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies para RATINGS
-- Usuários podem ver avaliações relacionadas a eles
CREATE POLICY "Users can view ratings related to them"
  ON ratings FOR SELECT
  USING (
    auth.uid() = rated_user_id OR 
    auth.uid() = rater_user_id OR
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  );

-- Usuários podem criar avaliações para serviços que participaram
CREATE POLICY "Users can create ratings for their services"
  ON ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rater_user_id AND
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  );

-- Policies para CHAT_MESSAGES
-- Usuários podem ver mensagens de serviços que participam
CREATE POLICY "Users can view messages from their services"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  );

-- Usuários podem enviar mensagens em serviços que participam
CREATE POLICY "Users can send messages in their services"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  );

-- Usuários podem atualizar status de leitura das mensagens
CREATE POLICY "Users can update read status of messages"
  ON chat_messages FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT company_id FROM services WHERE id = service_id
      UNION
      SELECT motoboy_id FROM services WHERE id = service_id
    )
  );

-- ============================================================================
-- 6. FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para calcular avaliação média de um usuário
CREATE OR REPLACE FUNCTION get_user_average_rating(user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0)
  FROM ratings
  WHERE rated_user_id = user_id;
$$ LANGUAGE SQL STABLE;

-- Função para adicionar XP e atualizar nível
CREATE OR REPLACE FUNCTION add_experience(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
DECLARE
  current_xp INTEGER;
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Buscar XP atual
  SELECT experience INTO current_xp
  FROM profiles
  WHERE id = user_id;
  
  -- Calcular novo XP e nível
  new_xp := current_xp + xp_amount;
  new_level := FLOOR(new_xp / 1000) + 1;
  
  -- Atualizar perfil
  UPDATE profiles
  SET 
    experience = new_xp,
    level = new_level,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar badge
CREATE OR REPLACE FUNCTION add_badge(user_id UUID, badge_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    badges = array_append(badges, badge_id),
    updated_at = NOW()
  WHERE id = user_id
    AND NOT (badge_id = ANY(badges)); -- Evita duplicatas
END;
$$ LANGUAGE plpgsql;

-- Função para marcar todas as mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_service_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE chat_messages
  SET read = TRUE
  WHERE service_id = p_service_id
    AND sender_id != p_user_id
    AND read = FALSE;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em ratings
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para adicionar XP quando uma corrida é concluída
CREATE OR REPLACE FUNCTION award_xp_on_service_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Adicionar 100 XP ao motoboy
    PERFORM add_experience(NEW.motoboy_id, 100);
    
    -- Se recebeu avaliação 5 estrelas, adicionar 50 XP extra
    IF EXISTS (
      SELECT 1 FROM ratings 
      WHERE service_id = NEW.id 
        AND rated_user_id = NEW.motoboy_id 
        AND rating = 5
    ) THEN
      PERFORM add_experience(NEW.motoboy_id, 50);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em services
DROP TRIGGER IF EXISTS award_xp_on_completion ON services;
CREATE TRIGGER award_xp_on_completion
  AFTER UPDATE ON services
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION award_xp_on_service_completion();

-- ============================================================================
-- 8. VIEWS ÚTEIS
-- ============================================================================

-- View com estatísticas de motoboys
CREATE OR REPLACE VIEW motoboy_stats AS
SELECT 
  p.id,
  p.full_name,
  p.level,
  p.experience,
  p.badges,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as total_rides,
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'completed'), 0) as total_earnings,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as total_ratings,
  ROUND(
    COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed')::NUMERIC / 
    NULLIF(COUNT(DISTINCT s.id) FILTER (WHERE s.status IN ('accepted', 'in_progress', 'completed')), 0) * 100,
    2
  ) as completion_rate
FROM profiles p
LEFT JOIN services s ON s.motoboy_id = p.id
LEFT JOIN ratings r ON r.rated_user_id = p.id
WHERE p.role = 'motoboy'
GROUP BY p.id, p.full_name, p.level, p.experience, p.badges;

COMMENT ON VIEW motoboy_stats IS 'Estatísticas agregadas dos motoboys';

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 20251024_add_new_features executada com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: ratings, chat_messages';
  RAISE NOTICE '🎮 Campos de gamificação adicionados ao profiles';
  RAISE NOTICE '📄 Campos de documentos adicionados ao profiles';
  RAISE NOTICE '🔒 Políticas RLS configuradas';
  RAISE NOTICE '⚡ Realtime habilitado para chat_messages';
  RAISE NOTICE '🎯 Funções auxiliares criadas';
  RAISE NOTICE '🔔 Triggers configurados';
END $$;
