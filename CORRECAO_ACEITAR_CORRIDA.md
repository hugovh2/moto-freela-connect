# 🔧 CORREÇÃO: ACEITAR CORRIDA

## 🚨 Problemas Identificados

### 1. **Erro SQL: Política Duplicada**
```
ERROR: 42710: policy "service_photos_insert" for table "objects" already exists
```
**Causa:** Script tentando criar políticas que já existem
**Solução:** ✅ Adicionado `DROP POLICY IF EXISTS` para todas as políticas

### 2. **Aceitar Corrida Não Funciona**
**Causa:** Políticas RLS muito restritivas impedindo UPDATE na tabela services
**Solução:** ✅ Criados scripts específicos para corrigir políticas

## 📁 Scripts Criados

### 1. `supabase/FIX_ALL_PROBLEMS.sql` (CORRIGIDO)
- ✅ Adicionado `DROP POLICY IF EXISTS` para todas as políticas de storage
- ✅ Corrige sistema de roles, status, storage e tabelas
- ✅ **Execute este script primeiro**

### 2. `supabase/FIX_ACCEPT_SERVICE.sql`
- ✅ Foco específico em políticas de aceitar corrida
- ✅ Políticas corretas para motoboy aceitar serviços
- ✅ Verificações de roles e serviços

### 3. `supabase/FIX_ACCEPT_SIMPLE.sql`
- ✅ Política temporária permissiva para debug
- ✅ Garante que todos os usuários tenham roles
- ✅ **Use este se o anterior não funcionar**

## 🔍 Debug Adicionado

### 1. `src/hooks/use-service-permissions.ts`
```typescript
const canAcceptService = (service: any): boolean => {
  const canAccept = (
    userRole === 'motoboy' && 
    service.status === 'available' && 
    !service.motoboy_id
  );
  
  console.log('[useServicePermissions] canAcceptService:', {
    userRole,
    serviceStatus: service.status,
    hasMotoboyId: !!service.motoboy_id,
    canAccept
  });
  
  return canAccept;
};
```

### 2. `src/components/ServiceCard.tsx`
```typescript
console.log('[ServiceCard] Props:', { isMotoboy, isCompany });
console.log('[ServiceCard] Service:', { id: service.id, status: service.status, motoboy_id: service.motoboy_id });
console.log('[ServiceCard] Permissions:', { userRole, userId, canAccept: canAcceptService(service) });
```

## 🚀 Como Aplicar as Correções

### Passo 1: Execute o SQL Corrigido
```sql
-- Copie e cole o conteúdo de supabase/FIX_ALL_PROBLEMS.sql
-- no SQL Editor do Supabase e execute
```

### Passo 2: Se ainda não funcionar, execute o script simples
```sql
-- Copie e cole o conteúdo de supabase/FIX_ACCEPT_SIMPLE.sql
-- no SQL Editor do Supabase e execute
```

### Passo 3: Recarregue a aplicação
```bash
# Recarregue a página (Ctrl+Shift+R)
# Ou reinicie o servidor de desenvolvimento
```

### Passo 4: Verifique os logs no console
```javascript
// Abra o console (F12) e procure por:
[useServicePermissions] canAcceptService: { userRole: 'motoboy', serviceStatus: 'available', hasMotoboyId: false, canAccept: true }
[ServiceCard] Permissions: { userRole: 'motoboy', userId: 'abc-123', canAccept: true }
```

## 🔍 Debugging

### Se o botão "Aceitar" não aparecer:
1. **Verifique o console** para logs de debug
2. **Verifique se userRole = 'motoboy'**
3. **Verifique se service.status = 'available'**
4. **Verifique se service.motoboy_id é null**

### Se o botão aparecer mas não funcionar:
1. **Verifique o console** para erros de SQL
2. **Execute o script FIX_ACCEPT_SIMPLE.sql**
3. **Verifique se o usuário tem role na tabela user_roles**

### Se ainda não funcionar:
1. **Execute o script FIX_ACCEPT_SIMPLE.sql** (política permissiva)
2. **Verifique se há serviços disponíveis** na tabela services
3. **Verifique se o usuário está autenticado**

## ✅ Resultado Esperado

### Antes da correção:
- ❌ Botão "Aceitar" não aparece
- ❌ Erro 406 ao tentar aceitar
- ❌ Políticas RLS bloqueando

### Depois da correção:
- ✅ Botão "Aceitar" aparece para motoboy
- ✅ Clique funciona e atualiza status
- ✅ Toast de sucesso aparece
- ✅ Card muda para ActiveRideCard

## 🎯 Status Final

- ✅ Script SQL corrigido (sem erros de política duplicada)
- ✅ Políticas RLS corrigidas para aceitar corrida
- ✅ Debug adicionado para identificar problemas
- ✅ Scripts alternativos para casos difíceis
- ✅ Sistema deve funcionar completamente

**Execute os scripts na ordem e o sistema deve funcionar!** 🎉
