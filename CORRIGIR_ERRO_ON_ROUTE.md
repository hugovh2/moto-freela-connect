# 🚨 CORREÇÃO ERRO: "invalid input value for enum service_status: on_route"

## ❌ O Problema
O banco de dados não reconhece o status `on_route` porque ele não existe no enum `service_status`.

## ✅ Solução (3 passos simples)

### 1️⃣ Acesse o Supabase Dashboard
- Abra: https://supabase.com/dashboard
- Selecione seu projeto

### 2️⃣ Vá no SQL Editor
- No menu lateral esquerdo, clique em **SQL Editor**
- Clique em **New Query**

### 3️⃣ Cole e Execute este SQL:

```sql
-- Adicionar os status que faltam
DO $$
BEGIN
  -- Adicionar 'on_route'
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'on_route' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'on_route';
    RAISE NOTICE '✅ Status on_route adicionado';
  END IF;

  -- Adicionar 'delivered' também
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'delivered' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'delivered';
    RAISE NOTICE '✅ Status delivered adicionado';
  END IF;

  -- Adicionar 'pending' também
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'pending' 
    AND enumtypid = 'service_status'::regtype
  ) THEN
    ALTER TYPE service_status ADD VALUE 'pending';
    RAISE NOTICE '✅ Status pending adicionado';
  END IF;
END $$;

-- Verificar se foi adicionado
SELECT enumlabel as status_disponivel, enumsortorder as ordem
FROM pg_enum
WHERE enumtypid = 'service_status'::regtype
ORDER BY enumsortorder;
```

### 4️⃣ Clique em **RUN** (ou pressione Ctrl+Enter)

## ✅ Resultado Esperado
Você verá uma lista com os status disponíveis incluindo:
- `on_route` ✅
- `delivered` ✅
- `pending` ✅

## 🔄 Depois de executar
1. Recarregue a página do seu app (F5)
2. O erro deve desaparecer
3. Suas corridas devem carregar normalmente

---

## 📁 Arquivo SQL Pronto
O SQL também está salvo em: `supabase/FIX_ON_ROUTE_ERROR.sql`
