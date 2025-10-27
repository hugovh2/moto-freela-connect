# 🔧 Resolver 3 Problemas

**Data:** 26/10/2025 - 22:50

---

## ✅ **PROBLEMAS RESOLVIDOS**

### 1️⃣ **Empresa define o valor da entrega**
### 2️⃣ **Cronômetro para ao entregar**  
### 3️⃣ **Erro ao adicionar foto de perfil**

---

## 1️⃣ **EMPRESA DEFINE O VALOR**

### **O que mudou:**

✅ Campo novo: **"Valor da Entrega (Você define)"**
✅ Sistema mostra **sugestão** baseada na distância
✅ Empresa pode **aceitar sugestão** ou **definir próprio valor**
✅ Preview mostra: "Valor Sugerido" vs "Valor Definido"

### **Como funciona:**

**Antes:**
```
Preço era calculado automaticamente:
R$ 8 (base) + R$ 2,50 por km
```

**Depois:**
```
1. Sistema calcula sugestão: R$ 38,50
2. Mostra no card: "Valor Sugerido: R$ 38,50"
3. Empresa digita: R$ 50,00 (pode pagar mais ou menos)
4. Campo mostra: "💰 Valor definido: R$ 50,00"
5. Entrega criada com R$ 50,00
```

### **Interface:**

```
┌──────────────────────────────────────┐
│ Resumo da Entrega                    │
│ ┌────────┬────────┬────────────────┐ │
│ │10.5 km │ 20 min │ Valor Sugerido││
│ │        │        │   R$ 38,50    ││
│ └────────┴────────┴────────────────┘ │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 💰 Valor da Entrega (Você define)    │
│ ┌────────────────────────────────────┐│
│ │ R$ 50.00                          ││
│ └────────────────────────────────────┘│
│ 💰 Valor definido: R$ 50,00          │
│ (ou)                                 │
│ 💡 Sugestão: R$ 38,50 (10.5 km)      │
└──────────────────────────────────────┘
```

---

## 2️⃣ **CRONÔMETRO PARA AO ENTREGAR**

### **O que mudou:**

✅ Cronômetro **PARA** quando status = delivered
✅ Mostra **tempo final** da corrida
✅ Não continua contando após entrega

### **Como funciona:**

**Antes:**
```
Cronômetro continuava rodando mesmo após entregar
00:15:42 → 00:15:43 → 00:15:44...
```

**Depois:**
```
1. Motoboy coleta: 10:00:00
   Cronômetro: 00:00:01, 00:00:02...

2. Motoboy entrega: 10:15:42
   Cronômetro PARA em: 00:15:42

3. Tempo final fixo: 00:15:42
   (não muda mais)
```

### **Lógica:**

```typescript
if (status === 'delivered') {
  // Calcular tempo final UMA VEZ
  const tempo_final = entrega - coleta
  // NÃO criar interval (não atualiza mais)
  return;
}

// Se não foi entregue, continua contando
setInterval(() => {
  tempo_atual = agora - coleta
}, 1000);
```

---

## 3️⃣ **ERRO AO ADICIONAR FOTO**

### **Causa do erro:**

❌ Bucket `avatars` **não existe** no Supabase Storage
❌ OU permissões não configuradas

### **Solução:**

#### **PASSO 1: Criar Bucket (Manual)**

1. Abrir **Supabase Dashboard**
2. Menu → **Storage**
3. Clicar **"New bucket"** ou **"Create bucket"**
4. Configurar:
   - **Name:** `avatars`
   - **Public:** ✅ **YES** (marcar)
   - **File size limit:** 5MB (opcional)
5. Clicar **"Create bucket"**

#### **PASSO 2: Configurar Permissões (SQL)**

Executar no **SQL Editor**:

```sql
-- Copiar de: SQL_CREATE_AVATARS_BUCKET.sql

-- Policy: Upload (usuários autenticados)
CREATE POLICY "Usuários podem fazer upload de avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Ver (público)
CREATE POLICY "Avatars são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: Atualizar (próprio avatar)
CREATE POLICY "Usuários podem atualizar próprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Deletar (próprio avatar)
CREATE POLICY "Usuários podem deletar próprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### **PASSO 3: Testar**

1. Recarregar página (F5)
2. Clicar no avatar (header)
3. Escolher foto
4. ✅ Upload deve funcionar!

---

## 📋 **CHECKLIST DE APLICAÇÃO**

### **Para o Valor Customizado:**
- [x] Código já aplicado em `CreateServiceDialogModern.tsx`
- [ ] Build: `npm run build`
- [ ] Testar criar entrega
- [ ] Verificar que campo de valor aparece
- [ ] Digitar valor customizado
- [ ] Confirmar que entrega usa valor digitado

### **Para o Cronômetro:**
- [x] Código já aplicado em `ActiveRideCard.tsx`
- [ ] Build: `npm run build`
- [ ] Motoboy aceita corrida
- [ ] Motoboy coleta pedido (cronômetro inicia)
- [ ] Motoboy entrega
- [ ] ✅ Verificar que cronômetro PARA
- [ ] Tempo final deve ficar fixo

### **Para a Foto de Perfil:**
- [ ] Criar bucket `avatars` no Supabase (manual)
- [ ] Executar SQL de permissões
- [ ] Recarregar app
- [ ] Clicar no avatar
- [ ] Escolher foto
- [ ] ✅ Upload deve funcionar sem erro

---

## 🚀 **COMO TESTAR**

### **Teste 1: Valor Customizado**
```
1. Empresa: Nova Entrega
2. Preencher endereços
3. Ver sugestão: R$ 38,50
4. Digitar: R$ 50,00
5. Criar entrega
6. ✅ Card mostra: R$ 50,00 (não R$ 38,50)
```

### **Teste 2: Cronômetro Para**
```
1. Motoboy aceita corrida
2. Cronômetro: --:--:-- (cinza)
3. Motoboy clica "Coletar"
4. Cronômetro: 00:00:01, 00:00:02... (contando)
5. Motoboy clica "Entregar"
6. ✅ Cronômetro PARA em: 00:15:42
7. ✅ Tempo não muda mais
```

### **Teste 3: Foto de Perfil**
```
1. Criar bucket `avatars` (Supabase)
2. Executar SQL de permissões
3. F5 para recarregar
4. Clicar no avatar (header)
5. Escolher foto (PNG, JPG)
6. ✅ Upload: "Foto atualizada!"
7. ✅ Avatar mostra foto nova
8. Recarregar página
9. ✅ Foto permanece
```

---

## 🛠️ **ERROS COMUNS**

### **Erro: "Bucket avatars does not exist"**
- ✅ **Solução:** Criar bucket manualmente no Dashboard
- Storage → New bucket → Nome: `avatars` → Public: YES

### **Erro: "new row violates row-level security policy"**
- ✅ **Solução:** Executar SQL de permissões
- Copiar de `SQL_CREATE_AVATARS_BUCKET.sql`

### **Cronômetro não para:**
- ✅ **Solução:** Verificar se código foi aplicado
- Build: `npm run build`
- Limpar cache: `rm -rf node_modules/.cache`

### **Valor customizado não salva:**
- ✅ **Solução:** Verificar console (F12)
- Ver se `finalPrice` está correto
- Testar digitar e criar entrega novamente

---

## 📊 **RESULTADO ESPERADO**

### **Valor Customizado:**
✅ Empresa vê sugestão de preço
✅ Empresa pode aceitar ou mudar
✅ Entrega criada com valor definido pela empresa
✅ Motoboy vê valor correto

### **Cronômetro:**
✅ Inicia ao coletar
✅ Conta em tempo real
✅ **PARA** ao entregar
✅ Mostra tempo total fixo

### **Foto de Perfil:**
✅ Upload funciona
✅ Foto aparece no header
✅ Foto persiste após reload
✅ Qualquer usuário pode mudar sua foto

---

## 📝 **ARQUIVOS AFETADOS**

### **Modificados:**
1. ✅ `src/components/CreateServiceDialogModern.tsx` - Campo de valor
2. ✅ `src/components/ActiveRideCard.tsx` - Cronômetro para

### **Criados:**
1. ✅ `SQL_CREATE_AVATARS_BUCKET.sql` - Config do bucket
2. ✅ `RESOLVER_3_PROBLEMAS.md` - Esta documentação

---

## ✅ **RESUMO**

**3 problemas, 3 soluções:**

1. **Valor:** Empresa define quanto pagar ✅
2. **Cronômetro:** Para ao entregar ✅
3. **Foto:** Criar bucket `avatars` ✅

**Próximos passos:**
1. Criar bucket `avatars` (manual)
2. Executar SQL de permissões
3. `npm run build`
4. Testar tudo!

---

**Tempo estimado:** 5 minutos
**Dificuldade:** Fácil ⭐
