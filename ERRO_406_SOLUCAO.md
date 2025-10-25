# 🚨 ERRO 406 - SOLUÇÃO IMEDIATA

## ❌ ERRO QUE VOCÊ ESTÁ VENDO

```
GET .../user_locations?select=*&user_id=eq.XXX 406 (Not Acceptable)
```

---

## ✅ CAUSA

O erro **406** significa que a tabela `user_locations` **NÃO EXISTE** ou as **políticas RLS estão bloqueando**.

---

## 🔧 SOLUÇÃO (2 MINUTOS)

### Execute este SQL AGORA:

1. **Abra:** https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/sql/new

2. **Copie TUDO** do arquivo: `supabase/FIX_406_ERROR.sql`

3. **Cole e Execute (RUN)**

4. **Aguarde ver:**
   ```
   ✅ CORREÇÃO COMPLETA! Recarregue o app e teste novamente.
   ```

---

## 🧪 DEPOIS DE EXECUTAR

### 1. Recarregue o App
```
Ctrl+Shift+R (hard reload)
```

### 2. Como Motoboy
1. Veja o card "Debug - Localização"
2. Clique "Testar Enviar Localização Agora"
3. ✅ Deve mostrar "Localização Salva no Supabase"

### 3. Console (F12)
Deve mostrar:
```
[LocationDebug] ✅ Localização encontrada: {latitude: -25.48, ...}
```

**NÃO deve mais mostrar:**
```
❌ Erro 406
❌ Not Acceptable
```

---

## 🔍 O QUE O SQL FAZ

1. ✅ Verifica se tabela existe
2. ✅ Cria tabela `user_locations` (se não existir)
3. ✅ Cria índices para performance
4. ✅ Habilita RLS (Row Level Security)
5. ✅ Cria políticas permissivas:
   - INSERT: usuário pode inserir própria localização
   - UPDATE: usuário pode atualizar própria localização
   - SELECT: **TODOS** autenticados podem ver (importante para rastreamento!)
6. ✅ Cria função `upsert_user_location`

---

## 🐛 SE O ERRO CONTINUAR

### Verifique no Console (F12):

**Se ver:**
```
[LocationDebug] ⚠️ Erro 406: Tabela pode não existir ou RLS bloqueando
```

**Faça:**
1. Abra Supabase > Table Editor
2. Procure por: `user_locations`
3. Se **NÃO existir**: Execute o SQL novamente
4. Se **existir**: Vá em "Policies" e verifique se tem 3 políticas

---

### Verifique as Políticas:

```sql
-- Cole no SQL Editor:
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'user_locations';

-- Deve mostrar:
-- anyone_can_view_locations     | SELECT
-- users_insert_own_location     | INSERT
-- users_update_own_location     | UPDATE
```

Se não mostrar essas 3, execute o `FIX_406_ERROR.sql` novamente.

---

## 🎯 TESTE RÁPIDO

**Cole no Console (F12) como Motoboy:**

```javascript
// Testar se consegue ler
const { data, error } = await supabase
  .from('user_locations')
  .select('*');

console.log('Data:', data, 'Error:', error);

// Se error for null ou undefined = FUNCIONOU!
// Se error existir = ainda há problema
```

---

## 📞 SE NADA RESOLVER

**Me envie isto:**

1. **Print da aba "Table Editor"** no Supabase
   - Mostra se `user_locations` existe

2. **Console do navegador (F12)**
   - Copie TODA a saída com os erros

3. **Resultado desta query:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%location%';
```

---

## ✅ CHECKLIST

- [ ] Executei `FIX_406_ERROR.sql`
- [ ] Vi mensagem "✅ CORREÇÃO COMPLETA!"
- [ ] Recarreguei o app (Ctrl+Shift+R)
- [ ] Console não mostra mais erro 406
- [ ] Card Debug mostra "✅ Localização Salva"

**Se TODOS marcados: FUNCIONOU! 🎉**

---

## 💡 DIFERENÇA DOS SQLs

**Você já tem vários SQLs, qual usar?**

- `FIX_406_ERROR.sql` ⭐ **USE ESTE** - Específico para erro 406
- `FIX_REALTIME.sql` - Mais completo, mas pode ter erro de duplicate
- `FIX_AGORA.sql` - Para enum e bucket de fotos

**Recomendação:** Execute `FIX_406_ERROR.sql` primeiro, é mais direto.

---

**Execute o SQL agora e o erro 406 vai sumir!** 🚀
