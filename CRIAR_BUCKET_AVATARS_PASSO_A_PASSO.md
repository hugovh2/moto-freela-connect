# 🪣 CRIAR BUCKET AVATARS - PASSO A PASSO

**Erro:** `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`

**Causa:** Bucket `avatars` não existe no Supabase Storage

---

## ✅ **SOLUÇÃO (5 minutos)**

### **PASSO 1: Acessar Supabase Dashboard**

1. Abrir navegador
2. Ir para: **https://supabase.com/dashboard**
3. Fazer login
4. Selecionar seu projeto (moto-freela-connect)

---

### **PASSO 2: Ir para Storage**

1. No menu lateral esquerdo, procurar por **"Storage"** 📦
2. Clicar em **"Storage"**
3. Você verá a lista de buckets (provavelmente vazia ou só `service-photos`)

---

### **PASSO 3: Criar Novo Bucket**

1. Clicar no botão **"New bucket"** ou **"Create a new bucket"**
   - Geralmente fica no canto superior direito
   - Pode ser um botão verde ou azul

2. Preencher o formulário:
   ```
   ┌─────────────────────────────────────┐
   │ Create a new bucket                 │
   ├─────────────────────────────────────┤
   │                                     │
   │ Name: avatars                       │
   │ ▼                                   │
   │                                     │
   │ ☑ Public bucket                     │
   │   (MARCAR ESTE CHECKBOX!)           │
   │                                     │
   │ [Cancel]  [Create bucket]           │
   └─────────────────────────────────────┘
   ```

3. **Nome:** Digite exatamente `avatars` (sem aspas, minúsculo)
4. **Public bucket:** ✅ **MARCAR** (muito importante!)
5. Clicar em **"Create bucket"** ou **"Create"**

---

### **PASSO 4: Verificar se foi criado**

Após criar, você deve ver:
```
Storage
├── service-photos    (se já existir)
└── avatars          ✅ NOVO!
```

---

### **PASSO 5: Configurar Permissões (SQL)**

Agora SIM, executar o SQL:

1. Menu lateral → **"SQL Editor"**
2. Clicar **"New query"**
3. Copiar e colar:

```sql
-- Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Policy: Ver avatars (público)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Upload (usuários autenticados)
CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Policy: Atualizar (usuários autenticados)
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Policy: Deletar (usuários autenticados)
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

4. Clicar **"Run"** ou pressionar **Ctrl+Enter**
5. Deve aparecer: **"Success. No rows returned"**

---

### **PASSO 6: Testar Upload**

1. Voltar para seu aplicativo
2. Recarregar página (F5)
3. Clicar no avatar (header)
4. Escolher uma foto
5. ✅ **Deve funcionar agora!**

---

## 🔍 **VERIFICAR SE BUCKET EXISTE**

Se tiver dúvida se criou corretamente:

1. **Dashboard → Storage**
2. Você deve ver o bucket **`avatars`** na lista
3. Clicar nele deve mostrar uma pasta vazia (tudo bem!)
4. No canto deve mostrar: **"Public"** ou ícone de 🌐

---

## ⚠️ **ERROS COMUNS**

### **"Policy already exists"**
- ✅ Normal! Significa que as policies já foram criadas
- Pode ignorar

### **"Bucket not found" ainda aparece**
- ❌ Bucket NÃO foi criado corretamente
- Voltar ao Passo 3 e criar novamente
- Verificar se o nome é exatamente `avatars`

### **"Permission denied"**
- ❌ Checkbox "Public" não foi marcado
- Deletar bucket e criar novamente COM checkbox marcado

---

## 📸 **COMO DEVE FICAR**

```
Supabase Dashboard
│
├── Storage
│   ├── service-photos      (fotos de entregas)
│   └── avatars    ✅ NOVO  (fotos de perfil)
│       └── (vazio inicialmente)
│
└── SQL Editor
    └── Policies criadas ✅
```

---

## 🎯 **CHECKLIST FINAL**

- [ ] Acessei Supabase Dashboard
- [ ] Cliquei em "Storage"
- [ ] Cliquei em "New bucket"
- [ ] Digite nome: `avatars`
- [ ] Marquei ✅ "Public bucket"
- [ ] Cliquei em "Create"
- [ ] Vejo bucket `avatars` na lista
- [ ] Executei SQL de permissões
- [ ] SQL retornou "Success"
- [ ] Recarreguei aplicativo (F5)
- [ ] Testei upload de foto
- [ ] ✅ Funcionou!

---

## 🆘 **SE AINDA NÃO FUNCIONAR**

### **Opção 1: Deletar e Recriar**
1. Storage → Bucket `avatars` → ⋮ (três pontos) → Delete
2. Criar novamente seguindo os passos acima
3. **NÃO ESQUECER** de marcar "Public bucket"

### **Opção 2: Verificar Configuração**
1. Clicar no bucket `avatars`
2. Ir em "Configuration" ou "Settings"
3. Verificar se está marcado como "Public"
4. Se não estiver, mudar para Public

### **Opção 3: Limpar Cache**
```bash
# No navegador
Ctrl + Shift + Delete
Limpar cache e cookies
Recarregar (F5)

# No código
rm -rf node_modules/.cache
npm run dev
```

---

## 📝 **RESUMO**

**O bucket NÃO pode ser criado via SQL!**
**Você PRECISA criar manualmente no Dashboard!**

**Passos:**
1. ✅ Dashboard → Storage
2. ✅ New bucket
3. ✅ Nome: `avatars`
4. ✅ Marcar: Public
5. ✅ Create
6. ✅ Executar SQL de permissões
7. ✅ Testar upload

---

**Tempo estimado:** 3-5 minutos
**Dificuldade:** Fácil ⭐

Após criar o bucket, o erro **"Bucket not found"** desaparece! 🎉
