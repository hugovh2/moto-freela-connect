# 🚨 EXECUTE ESTE SQL AGORA!

## ❌ Erros que estão acontecendo:
- `invalid input value for enum service_status: "collected"` 
- `new row violates row-level security policy`
- `400 Bad Request` ao confirmar coleta
- `400 Bad Request` ao enviar foto

---

## ✅ SOLUÇÃO (5 minutos):

### Passo 1: Abrir Supabase SQL Editor
1. Vá em: **https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc**
2. No menu lateral, clique em: **SQL Editor**
3. Clique em: **New query** (botão azul)

### Passo 2: Copiar o SQL
1. Abra o arquivo: `supabase/FIX_AGORA.sql`
2. Selecione **TODO O CONTEÚDO** (Ctrl+A)
3. Copie (Ctrl+C)

### Passo 3: Colar e Executar
1. Cole no SQL Editor (Ctrl+V)
2. Clique em **RUN** (ou pressione Ctrl+Enter)
3. Aguarde a execução (5-10 segundos)

### Passo 4: Verificar Resultado
Você deve ver no final:
```
✅ CORREÇÕES APLICADAS COM SUCESSO!
Recarregue o navegador (Ctrl+Shift+R) e teste novamente
```

**E também deve ver:**
- Enum com valores: `available, accepted, collected, in_progress, completed, cancelled`
- Bucket: `service-photos` com `public = true`
- 4 políticas de storage criadas
- 1 política de UPDATE para motoboys

---

## Passo 5: Recarregar Aplicação
```bash
# Se o servidor estiver rodando, reinicie:
Ctrl+C
npm run dev
```

No navegador:
- **Ctrl+Shift+R** (hard reload)

---

## 🧪 Teste Agora:

### Teste 1: Confirmar Coleta
1. Login como motoboy
2. Aceite uma corrida
3. Clique em **"Confirmar Coleta"**
4. ✅ Deve mudar status para "Coletado" **SEM erro 400**

### Teste 2: Upload de Foto
1. Clique em **"Tirar Foto"**
2. Selecione uma imagem
3. ✅ Deve fazer upload **SEM erro RLS**

---

## ❓ Se AINDA der erro:

### Erro: "collected" já existe mas continua dando erro
```sql
-- Execute isto no SQL Editor:
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;

-- Deve mostrar:
-- available
-- accepted
-- collected  ← SE NÃO APARECER, execute FIX_AGORA.sql novamente
-- in_progress
-- completed
-- cancelled
```

### Erro: RLS continua bloqueando upload
```sql
-- Verifique as políticas:
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Deve ter:
-- service_photos_delete
-- service_photos_insert  ← OBRIGATÓRIO
-- service_photos_select
-- service_photos_update
```

### Erro: Não consigo atualizar status
```sql
-- Verifique se você é o motoboy da corrida:
SELECT id, status, motoboy_id 
FROM services 
WHERE id = 'SEU_SERVICE_ID_AQUI';

-- O motoboy_id deve ser igual ao seu user ID
```

---

## 📞 AINDA COM PROBLEMA?

Mande o resultado destas queries:

```sql
-- 1. Enum
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'service_status'::regtype;

-- 2. Bucket
SELECT id, public FROM storage.buckets 
WHERE id = 'service-photos';

-- 3. Políticas Storage
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Sua role
SELECT role FROM user_roles 
WHERE user_id = auth.uid();
```

---

## ⚡ ATALHO RÁPIDO:

**Copie e cole tudo de uma vez:**

1. Abra: https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/sql/new
2. Cole o conteúdo de `supabase/FIX_AGORA.sql`
3. Clique RUN
4. Recarregue o navegador

**PRONTO!** Os erros 400 devem sumir. ✅
