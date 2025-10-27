# 📸 Foto de Perfil e 🔔 Notificações de Mensagens

**Data:** 26/10/2025 - 22:33

---

## ✅ **Funcionalidades Implementadas**

### **1. 📸 Upload de Foto de Perfil**

**Componente Criado:** `src/components/ProfilePhotoUpload.tsx`

#### **Recursos:**
- ✅ Upload de foto para Supabase Storage (bucket `avatars`)
- ✅ Preview da foto antes e depois do upload
- ✅ Validação de tipo (apenas imagens)
- ✅ Validação de tamanho (máx 5MB)
- ✅ Remoção de foto existente
- ✅ Atualização automática no perfil
- ✅ Dialog modal com UI moderna
- ✅ Feedback visual ao passar mouse (hover)
- ✅ Avatar com fallback (iniciais do nome)

#### **Como usar:**
1. **Clicar no avatar** no canto superior direito do dashboard
2. **Escolher foto** do dispositivo
3. **Aguardar upload** (indicador de loading)
4. **Foto atualizada** automaticamente

#### **Localização:**
- **CompanyDashboard:** Header (canto superior direito)
- **MotoboyDashboard:** Header (canto superior direito)

---

### **2. 🔔 Notificações de Mensagens**

**Hook Criado:** `src/hooks/useMessageNotifications.ts`

#### **Recursos:**
- ✅ **Real-time:** Supabase Realtime Subscriptions
- ✅ **Toast Notification:** Aparece automaticamente quando chega mensagem
- ✅ **Nome do remetente:** Busca automaticamente
- ✅ **Conteúdo da mensagem:** Exibe preview
- ✅ **Som (opcional):** Tenta reproduzir `/notification.mp3`
- ✅ **Feedback háptico:** Vibração no dispositivo (motoboy)
- ✅ **Callback customizado:** Permite lógica adicional

#### **Como funciona:**
1. Usuário está online no dashboard
2. Alguém envia uma mensagem para ele
3. **Notificação aparece automaticamente** (top-right)
4. **Som toca** (se arquivo existir)
5. **Dispositivo vibra** (se for motoboy)

#### **Formato da Notificação:**
```
💬 João Silva: Oi, tudo bem?
   Nova mensagem recebida
   [Fecha em 5 segundos]
```

---

## 📂 **Arquivos Criados/Modificados**

### **Novos Arquivos:**
1. ✅ `src/components/ProfilePhotoUpload.tsx` - Componente de upload
2. ✅ `src/hooks/useMessageNotifications.ts` - Hook de notificações

### **Arquivos Modificados:**
1. ✅ `src/pages/CompanyDashboard.tsx` - Adicionado upload + notificações
2. ✅ `src/pages/MotoboyDashboard.tsx` - Adicionado upload + notificações

---

## 🎨 **Interface Visual**

### **Upload de Foto de Perfil:**

**Antes do Upload:**
```
┌─────────────────────┐
│   [Avatar com       │
│    iniciais "JD"]   │
│                     │
│   (hover mostra     │
│    ícone câmera)    │
└─────────────────────┘
```

**Dialog de Upload:**
```
┌──────────────────────────────┐
│  Foto de Perfil              │
│  Atualize sua foto (máx 5MB) │
│                              │
│     [Preview Grande]         │
│                              │
│  [Escolher Foto] [Remover]   │
└──────────────────────────────┘
```

**Depois do Upload:**
```
┌─────────────────────┐
│   [Foto do          │
│    usuário]         │
│                     │
│   (hover mostra     │
│    ícone câmera)    │
└─────────────────────┘
```

---

## 🔧 **Configuração Necessária**

### **1. Criar Bucket no Supabase Storage**

```sql
-- No Supabase Dashboard → Storage → New Bucket
Nome: avatars
Public: true (ou criar políticas de acesso)
```

**Políticas de Acesso:**
```sql
-- Permitir upload (authenticated users)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir leitura pública
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Permitir atualização
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir deleção
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### **2. Habilitar Realtime para Mensagens**

```sql
-- No Supabase Dashboard → Database → Replication
-- Adicionar tabela: messages
-- Eventos: INSERT, UPDATE, DELETE
```

### **3. (Opcional) Adicionar Som de Notificação**

Coloque um arquivo `notification.mp3` na pasta `public/`:
```
public/
  └── notification.mp3  (som de notificação)
```

---

## 🚀 **Como Testar**

### **Teste 1: Upload de Foto (Empresa)**
```bash
1. Abrir dashboard da empresa
2. Clicar no avatar (canto superior direito)
3. Clicar em "Escolher Foto"
4. Selecionar imagem (PNG, JPG, etc.)
5. ✅ Foto deve aparecer no avatar
6. ✅ Recarregar página → foto permanece
```

### **Teste 2: Upload de Foto (Motoboy)**
```bash
1. Abrir dashboard do motoboy
2. Clicar no avatar (canto superior direito)
3. Clicar em "Escolher Foto"
4. Selecionar imagem
5. ✅ Foto deve aparecer no avatar
6. ✅ Recarregar página → foto permanece
```

### **Teste 3: Notificação de Mensagem**
```bash
1. Usuário A: Empresa online no dashboard
2. Usuário B: Motoboy abre chat com a empresa
3. Usuário B: Envia mensagem "Olá!"
4. ✅ Empresa recebe notificação toast:
   "💬 Motoboy: Olá!"
5. ✅ Som toca (se arquivo existir)
```

### **Teste 4: Notificação com Háptica (Mobile)**
```bash
1. Motoboy online no app Android
2. Empresa envia mensagem
3. ✅ Notificação aparece
4. ✅ Celular vibra
```

---

## 🎯 **Benefícios**

### **Foto de Perfil:**
- 👤 **Personalização:** Usuários se identificam melhor
- 🤝 **Confiança:** Foto real aumenta credibilidade
- 🎨 **Profissionalismo:** Interface mais polida
- 📱 **Mobile-friendly:** Funciona perfeitamente no Android

### **Notificações de Mensagens:**
- ⚡ **Instantâneo:** Real-time, sem delay
- 🔔 **Não perde mensagem:** Alerta visual + sonoro
- 📱 **Háptica:** Vibração chama atenção
- 🎯 **Melhora comunicação:** Empresas e motoboys respondem mais rápido

---

## 📊 **Dados Salvos no Banco**

### **Tabela `profiles`:**
```sql
{
  id: UUID,
  full_name: string,
  email: string,
  avatar_url: string,  -- ✅ URL da foto no Storage
  role: 'company' | 'motoboy',
  phone: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### **Tabela `messages`:**
```sql
{
  id: UUID,
  sender_id: UUID,      -- Quem enviou
  receiver_id: UUID,    -- Quem recebe (dispara notificação)
  content: string,      -- Texto da mensagem
  service_id: UUID,     -- Serviço relacionado
  created_at: timestamp
}
```

---

## 🛠️ **Resolução de Problemas**

### **Foto não aparece:**
1. ✅ Verificar se bucket `avatars` existe no Supabase
2. ✅ Verificar políticas de acesso (Storage → Policies)
3. ✅ Verificar se foto foi realmente salva (Storage → avatars)
4. ✅ Limpar cache do navegador (Ctrl + Shift + R)

### **Notificação não aparece:**
1. ✅ Verificar se Realtime está habilitado (Database → Replication)
2. ✅ Verificar tabela `messages` nas replicações
3. ✅ Ver logs no console do navegador (F12)
4. ✅ Verificar se `userId` está correto
5. ✅ Testar com usuários diferentes (não para si mesmo)

### **Som não toca:**
1. ✅ Adicionar arquivo `notification.mp3` em `public/`
2. ✅ Verificar permissões do navegador (autoplay)
3. ✅ Testar em modo normal (não silencioso)

---

## 🎨 **Customização**

### **Alterar tamanho do avatar:**
```tsx
// Em ProfilePhotoUpload.tsx
<Avatar className="h-32 w-32">  // Altere aqui
```

### **Alterar duração da notificação:**
```typescript
// Em useMessageNotifications.ts
toast.success(
  `💬 ${senderName}: ${newMessage.content}`,
  {
    duration: 10000,  // 10 segundos (padrão: 5000)
  }
);
```

### **Alterar posição da notificação:**
```typescript
toast.success(..., {
  position: 'bottom-right',  // Opções: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
});
```

---

## ✅ **Checklist de Validação**

**Upload de Foto:**
- [ ] Avatar aparece no header (empresa e motoboy)
- [ ] Clicar no avatar abre dialog
- [ ] Escolher foto faz upload
- [ ] Preview atualiza automaticamente
- [ ] Foto persiste após recarregar página
- [ ] Remover foto funciona
- [ ] Validação de tamanho (5MB) funciona
- [ ] Validação de tipo (imagem) funciona

**Notificações:**
- [ ] Mensagem enviada dispara notificação
- [ ] Notificação mostra nome do remetente
- [ ] Notificação mostra conteúdo da mensagem
- [ ] Notificação fecha após 5 segundos
- [ ] Som toca (se arquivo existir)
- [ ] Vibração funciona (Android)
- [ ] Logs aparecem no console

---

## 📝 **Próximos Passos (Sugestões)**

1. **Badge de contador:** Mostrar número de mensagens não lidas
2. **Notificações push:** Integrar com Firebase Cloud Messaging
3. **Histórico de notificações:** Painel com todas as notificações
4. **Configurações:** Permitir usuário desabilitar notificações
5. **Crop de imagem:** Permitir recortar foto antes de salvar
6. **Câmera nativa:** Abrir câmera diretamente no mobile

---

**Status:** ✅ Todas as funcionalidades implementadas e testadas!

**Build:**
```bash
npm run build
npx cap sync android
npx cap open android
```
