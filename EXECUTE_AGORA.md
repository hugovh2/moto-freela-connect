# ⚡ EXECUTE AGORA - 3 Passos Rápidos

## 🎯 Passo 1: Abrir SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em **"SQL Editor"** (menu lateral esquerdo)
4. Clique em **"+ New query"**

---

## 📋 Passo 2: Copiar e Colar

**Copie TODO o texto abaixo** e cole no SQL Editor:

```sql
-- ============================================================================
-- MIGRATION: Add New Features v2.0
-- ============================================================================

-- 1. TABELA DE AVALIAÇÕES
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

CREATE INDEX IF NOT EXISTS idx_ratings_service ON ratings(service_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_user ON ratings(rater_user_id);

-- 2. TABELA DE CHAT
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

CREATE INDEX IF NOT EXISTS idx_chat_service ON chat_messages(service_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);

-- 3. ADICIONAR CAMPOS EM PROFILES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cnh_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS crlv_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents_verified BOOLEAN DEFAULT FALSE;

-- 4. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- 5. RLS POLICIES
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies para ratings
CREATE POLICY "Users can view ratings related to them" ON ratings FOR SELECT
USING (auth.uid() = rated_user_id OR auth.uid() = rater_user_id);

CREATE POLICY "Users can create ratings" ON ratings FOR INSERT
WITH CHECK (auth.uid() = rater_user_id);

-- Policies para chat
CREATE POLICY "Users can view their messages" ON chat_messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() IN (
  SELECT company_id FROM services WHERE id = service_id
  UNION SELECT motoboy_id FROM services WHERE id = service_id
));

CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status" ON chat_messages FOR UPDATE
USING (auth.uid() IN (
  SELECT company_id FROM services WHERE id = service_id
  UNION SELECT motoboy_id FROM services WHERE id = service_id
));

-- 6. FUNÇÕES AUXILIARES
CREATE OR REPLACE FUNCTION get_user_average_rating(user_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(AVG(rating), 0) FROM ratings WHERE rated_user_id = user_id;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION add_experience(user_id UUID, xp_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET experience = experience + xp_amount,
      level = FLOOR((experience + xp_amount) / 1000) + 1,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION add_badge(user_id UUID, badge_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET badges = array_append(badges, badge_id), updated_at = NOW()
  WHERE id = user_id AND NOT (badge_id = ANY(badges));
END;
$$ LANGUAGE plpgsql;

-- 7. TRIGGER PARA XP
CREATE OR REPLACE FUNCTION award_xp_on_service_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    PERFORM add_experience(NEW.motoboy_id, 100);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS award_xp_on_completion ON services;
CREATE TRIGGER award_xp_on_completion
  AFTER UPDATE ON services
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION award_xp_on_service_completion();

-- 8. VIEW DE ESTATÍSTICAS
CREATE OR REPLACE VIEW motoboy_stats AS
SELECT 
  p.id, p.full_name, p.level, p.experience, p.badges,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as total_rides,
  COALESCE(SUM(s.price) FILTER (WHERE s.status = 'completed'), 0) as total_earnings,
  COALESCE(AVG(r.rating), 0) as average_rating
FROM profiles p
LEFT JOIN services s ON s.motoboy_id = p.id
LEFT JOIN ratings r ON r.rated_user_id = p.id
WHERE p.role = 'motoboy'
GROUP BY p.id, p.full_name, p.level, p.experience, p.badges;

-- MENSAGEM DE SUCESSO
DO $$ BEGIN
  RAISE NOTICE '✅ Migration executada com sucesso!';
  RAISE NOTICE '📊 Tabelas: ratings, chat_messages';
  RAISE NOTICE '🎮 Campos: badges, level, experience, documentos';
  RAISE NOTICE '🔒 RLS configurado';
  RAISE NOTICE '⚡ Realtime habilitado';
END $$;
```

---

## ▶️ Passo 3: Executar

1. **Clique no botão "Run"** (canto inferior direito)
2. **OU pressione:** Ctrl + Enter
3. **Aguarde** ~30 segundos
4. **Verifique** se apareceu: ✅ "Success. No rows returned"

---

## 🗄️ Passo 4: Criar Bucket (Storage)

1. Vá para **"Storage"** (menu lateral)
2. Clique em **"Create a new bucket"**
3. Configure:
   - **Name:** `documents`
   - **Public:** ❌ Desmarcar
   - **File size limit:** 5 MB
4. Clique em **"Create bucket"**

---

## ✅ Verificar

Execute esta query para confirmar:

```sql
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name IN ('ratings', 'chat_messages')) as tabelas_criadas,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'profiles' AND column_name IN ('badges', 'level')) as campos_criados;
```

**Resultado esperado:** `tabelas_criadas: 2`, `campos_criados: 2`

---

## 🎉 PRONTO!

Agora você tem:
- ✅ Sistema de avaliação (ratings)
- ✅ Chat em tempo real (chat_messages)
- ✅ Gamificação (badges, level, XP)
- ✅ Upload de documentos (campos prontos)
- ✅ Funções auxiliares
- ✅ Triggers automáticos

**Pode começar a usar as novas funcionalidades!** 🚀

---

## 🐛 Se der erro

**"relation already exists"** → Já foi criado antes, pode ignorar  
**"permission denied"** → Use a service_role key  
**"column already exists"** → Já existe, pode ignorar  

**Tudo certo mesmo com esses erros!** ✅
