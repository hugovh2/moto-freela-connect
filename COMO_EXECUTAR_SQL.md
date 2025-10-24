# 🗄️ Como Executar os Scripts SQL no Supabase

**Versão:** 2.0.0  
**Data:** 24 de Outubro de 2025

---

## 📋 Opções para Executar

Você tem **3 opções** para executar os scripts SQL:

### ✅ Opção 1: SQL Editor do Supabase (RECOMENDADO)
### ✅ Opção 2: Script Node.js Automatizado
### ✅ Opção 3: Supabase CLI

---

## 🎯 Opção 1: SQL Editor do Supabase (Mais Fácil)

### Passo 1: Acessar o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto `moto-freela-connect`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Criar Nova Query
1. Clique em **"+ New query"**
2. Dê um nome: `Add New Features v2.0`

### Passo 3: Copiar e Colar o SQL
1. Abra o arquivo: `supabase/migrations/20251024_add_new_features.sql`
2. Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase (Ctrl+V)

### Passo 4: Executar
1. Clique no botão **"Run"** (ou pressione Ctrl+Enter)
2. Aguarde a execução (pode levar 10-30 segundos)
3. Verifique se apareceu a mensagem de sucesso ✅

### Passo 5: Verificar
Execute esta query para verificar se tudo foi criado:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('ratings', 'chat_messages');

-- Verificar novos campos em profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('badges', 'level', 'experience', 'cnh_url', 'documents_verified');
```

**Resultado Esperado:**
- 2 tabelas: `ratings`, `chat_messages`
- 8 novos campos em `profiles`

---

## 🤖 Opção 2: Script Node.js Automatizado

### Passo 1: Instalar Dependência
```bash
npm install dotenv
```

### Passo 2: Configurar .env
Adicione no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_KEY=sua_service_key_aqui  # Opcional, mas recomendado
```

**Onde encontrar a Service Key:**
1. Supabase Dashboard → Settings → API
2. Copie a **service_role key** (⚠️ NUNCA compartilhe esta chave!)

### Passo 3: Executar Script
```bash
node scripts/run-migration.js
```

**Saída Esperada:**
```
🚀 Iniciando migration...
📄 Arquivo de migration carregado
⚡ Executando SQL no Supabase...
✅ Migration executada com sucesso!
📊 Tabelas criadas: ratings, chat_messages
🎮 Campos adicionados ao profiles
✨ Tudo pronto!
```

---

## 🔧 Opção 3: Supabase CLI

### Passo 1: Instalar Supabase CLI
```bash
npm install -g supabase
```

### Passo 2: Login
```bash
supabase login
```

### Passo 3: Link ao Projeto
```bash
supabase link --project-ref seu-projeto-ref
```

### Passo 4: Executar Migration
```bash
supabase db push
```

---

## 🗄️ Criar Bucket de Storage

Além das tabelas, você precisa criar um bucket para armazenar documentos:

### Via Dashboard (Recomendado):
1. Vá para **Storage** no Supabase Dashboard
2. Clique em **"Create a new bucket"**
3. Configure:
   - **Name:** `documents`
   - **Public:** ❌ Desmarcar (privado)
   - **Allowed MIME types:** `image/jpeg, image/png, image/jpg`
   - **Max file size:** `5 MB`
4. Clique em **"Create bucket"**

### Via SQL:
```sql
-- Criar bucket (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## ✅ Checklist de Verificação

Após executar os scripts, verifique:

### Tabelas
- [ ] Tabela `ratings` criada
- [ ] Tabela `chat_messages` criada
- [ ] Índices criados nas tabelas

### Campos em Profiles
- [ ] `badges` (TEXT[])
- [ ] `level` (INTEGER)
- [ ] `experience` (INTEGER)
- [ ] `cnh_url` (TEXT)
- [ ] `crlv_url` (TEXT)
- [ ] `selfie_url` (TEXT)
- [ ] `vehicle_photo_url` (TEXT)
- [ ] `documents_verified` (BOOLEAN)

### Políticas RLS
- [ ] Políticas criadas para `ratings`
- [ ] Políticas criadas para `chat_messages`

### Realtime
- [ ] Realtime habilitado para `chat_messages`

### Funções
- [ ] `get_user_average_rating()`
- [ ] `add_experience()`
- [ ] `add_badge()`
- [ ] `mark_messages_as_read()`

### Storage
- [ ] Bucket `documents` criado
- [ ] Políticas de acesso configuradas

---

## 🐛 Troubleshooting

### Erro: "relation already exists"
**Solução:** As tabelas já existem. Você pode:
1. Ignorar o erro (é seguro)
2. Ou adicionar `IF NOT EXISTS` nas queries

### Erro: "permission denied"
**Solução:** Use a **service_role key** ao invés da anon key.

### Erro: "column already exists"
**Solução:** Os campos já foram adicionados. Pode ignorar.

### Erro ao criar bucket
**Solução:** Verifique se o bucket já existe em Storage → Buckets.

---

## 📊 Queries Úteis para Testar

### Verificar se tudo foi criado:
```sql
-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM ratings) as total_ratings,
  (SELECT COUNT(*) FROM chat_messages) as total_messages,
  (SELECT COUNT(*) FROM profiles WHERE badges IS NOT NULL) as profiles_with_badges;

-- Ver estrutura das tabelas
\d ratings
\d chat_messages
\d profiles
```

### Testar funções:
```sql
-- Adicionar XP a um usuário
SELECT add_experience('user-uuid-aqui', 100);

-- Adicionar badge
SELECT add_badge('user-uuid-aqui', 'first_ride');

-- Ver avaliação média
SELECT get_user_average_rating('user-uuid-aqui');
```

### Ver estatísticas:
```sql
-- Ver estatísticas de todos os motoboys
SELECT * FROM motoboy_stats;
```

---

## 🎉 Pronto!

Após executar os scripts, você terá:
- ✅ 2 novas tabelas (ratings, chat_messages)
- ✅ 8 novos campos em profiles
- ✅ Políticas RLS configuradas
- ✅ Realtime habilitado
- ✅ 4 funções auxiliares
- ✅ Triggers automáticos
- ✅ 1 view de estatísticas
- ✅ Bucket de storage

**Tudo pronto para usar as novas funcionalidades!** 🚀

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs no SQL Editor
2. Consulte a documentação do Supabase
3. Revise o arquivo `20251024_add_new_features.sql`

---

**Desenvolvido com ❤️ para MotoFreela Connect**
