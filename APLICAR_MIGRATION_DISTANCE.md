# 🔧 Como Aplicar Migration - Adicionar Distância e Tempo

**Erro:** `Could not find the 'distance_km' column of 'services' in the schema cache`

**Causa:** As colunas `distance_km` e `estimated_time_minutes` não existem no banco de dados.

---

## ✅ **SOLUÇÃO RÁPIDA**

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. **Abrir Supabase Dashboard:**
   - Ir para: https://supabase.com/dashboard
   - Selecionar seu projeto

2. **Abrir SQL Editor:**
   - Menu lateral → **SQL Editor**
   - Clicar em **New Query**

3. **Copiar e Colar este SQL:**
```sql
-- Adicionar colunas de distância e tempo estimado
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2);

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER;

-- Adicionar comentários
COMMENT ON COLUMN services.distance_km IS 'Distância em km';
COMMENT ON COLUMN services.estimated_time_minutes IS 'Tempo estimado em minutos';

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_services_distance 
ON services(distance_km) 
WHERE distance_km IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_services_estimated_time 
ON services(estimated_time_minutes) 
WHERE estimated_time_minutes IS NOT NULL;
```

4. **Executar:**
   - Clicar em **Run** (ou pressionar Ctrl + Enter)
   - ✅ Deve aparecer: "Success. No rows returned"

5. **Verificar:**
```sql
-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'services' 
AND column_name IN ('distance_km', 'estimated_time_minutes');
```

---

### **Opção 2: Via Arquivo de Migration**

Se você usa Supabase CLI:

```bash
# 1. Copiar arquivo de migration para pasta correta
# O arquivo já está em: supabase/migrations/add_distance_and_time_to_services.sql

# 2. Aplicar migration
supabase db push

# 3. Verificar
supabase db diff
```

---

## 📊 **O que essas colunas fazem?**

### **`distance_km` (DECIMAL)**
- Armazena a distância entre origem e destino
- Calculada usando fórmula Haversine (coordenadas GPS)
- Exemplo: `10.5` (10.5 km)

### **`estimated_time_minutes` (INTEGER)**
- Tempo estimado de entrega
- Calculado baseado em velocidade média de 30 km/h
- Fórmula: `(distance_km / 30) * 60`
- Exemplo: `20` (20 minutos)

---

## 🔍 **Verificar se deu certo:**

### **1. Via SQL:**
```sql
-- Ver estrutura da tabela
SELECT * FROM services LIMIT 1;
```

### **2. Criar um serviço de teste:**
```
1. Abrir dashboard da empresa
2. Criar nova entrega
3. Informar origem e destino com coordenadas
4. ✅ Deve calcular distância e tempo automaticamente
```

### **3. Ver no banco:**
```sql
-- Ver serviços com distância e tempo
SELECT 
  id,
  title,
  distance_km,
  estimated_time_minutes,
  created_at
FROM services
WHERE distance_km IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚨 **Se ainda der erro:**

### **Erro persiste após migration:**
1. **Limpar cache do TypeScript:**
```bash
# Parar servidor dev
# Deletar pasta .next ou node_modules/.cache
rm -rf node_modules/.cache
npm run dev
```

2. **Atualizar tipos do Supabase:**
```bash
npx supabase gen types typescript --project-id [SEU_PROJECT_ID] > src/integrations/supabase/types.ts
```

3. **Reiniciar servidor dev:**
```bash
npm run dev
```

---

## 📝 **Dados de Exemplo**

Após aplicar a migration e criar um serviço:

```json
{
  "id": "uuid-123",
  "title": "Entrega de Documento",
  "pickup_location": "Av. Paulista, 1000",
  "delivery_location": "Rua Augusta, 500",
  "distance_km": 2.5,              // ✅ NOVO
  "estimated_time_minutes": 5,     // ✅ NOVO
  "price": 15.00,
  "status": "available"
}
```

---

## ✅ **Checklist**

- [ ] Executei SQL no Supabase Dashboard
- [ ] Mensagem "Success" apareceu
- [ ] Verifiquei que colunas foram criadas
- [ ] Reiniciei o servidor dev (`npm run dev`)
- [ ] Criei um serviço de teste
- [ ] Distância e tempo aparecem nos cards
- [ ] Erro não aparece mais

---

## 🎯 **Resultado Esperado**

Após aplicar a migration:

**ANTES:**
```
❌ Error: Could not find the 'distance_km' column
```

**DEPOIS:**
```
✅ Serviço criado com sucesso!
✅ Card mostra: "10.5 km" e "20 min"
✅ Sem erros no console
```

---

**Tempo estimado:** 2 minutos
**Dificuldade:** Fácil ⭐
**Requer:** Acesso ao Supabase Dashboard
