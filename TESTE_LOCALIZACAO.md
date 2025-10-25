# 🧪 TESTE DE LOCALIZAÇÃO - PASSO A PASSO

## ⚠️ IMPORTANTE: Execute os SQLs PRIMEIRO!

### Passo 1: Executar FIX_REALTIME.sql
```
1. https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/sql/new
2. Copie TODO o conteúdo de: supabase/FIX_REALTIME.sql
3. Cole e Execute (RUN)
4. Aguarde ver: "✅ REALTIME CONFIGURADO COM SUCESSO!"
```

---

## 🧪 TESTE 1: Verificar se Localização Está Sendo Salva

### Como Motoboy:

1. **Login como motoboy**
2. **Recarregue a página** (Ctrl+Shift+R)
3. **Veja o card "Debug - Localização"** (novo card ao lado do Location Tracker)
4. **Clique em "Testar Enviar Localização Agora"**

### ✅ Resultado Esperado:
- Toast: "Localização enviada!"
- Card mostra: "✅ Localização Salva no Supabase"
- Aparecem: Latitude, Longitude, Precisão

### ❌ Se der erro:
```
Veja o Console (F12) e copie o erro exato.
```

Possíveis erros:
- **"function upsert_user_location does not exist"** → Execute FIX_REALTIME.sql
- **"permission denied"** → Problema nas políticas RLS
- **"relation user_locations does not exist"** → Execute FIX_REALTIME.sql

---

## 🧪 TESTE 2: Verificar se Empresa Vê Localização

### Como Empresa:

1. **Login como empresa em OUTRA aba/navegador**
2. **Aguarde motoboy aceitar uma corrida**
3. **Clique na corrida aceita**
4. **Veja "Rastreamento em Tempo Real"**

### ✅ Resultado Esperado:
- Mapa do Google carrega
- Pin mostra localização do motoboy
- "Tempo Estimado" calcula (pode ser mock por enquanto)

### ❌ Se continuar "Aguardando localização do motoboy...":

#### Verificação A: Motoboy enviou localização?
```
No dashboard do motoboy:
- Card "Debug - Localização" deve mostrar "✅ Localização Salva"
- Se não, clique em "Testar Enviar Localização Agora"
```

#### Verificação B: Verificar no Supabase
```
1. https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/editor
2. Clique na tabela: user_locations
3. Veja se tem registros
4. Confira se o user_id é do motoboy
```

#### Verificação C: Console do navegador
```
1. F12 (DevTools)
2. Aba Console
3. Veja se tem erros vermelhos
4. Procure por:
   - "Erro ao carregar localização"
   - "Error loading motoboy location"
```

---

## 🧪 TESTE 3: Atualização Automática

### Como funciona agora:
- ✅ **LocationTracker** envia localização a cada mudança de GPS
- ✅ **LiveTracking** recebe updates via Realtime
- ✅ Mapa atualiza automaticamente

### Teste:
1. **Motoboy:** Aceite corrida + Fique Online
2. **Empresa:** Abra a corrida
3. **Motoboy:** Mova-se (ou simule mudança de localização no DevTools)
4. **Empresa:** Veja se o mapa atualiza

---

## 🔍 DEBUG AVANÇADO

### Ver Localização no Banco de Dados:

1. Acesse: https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/editor
2. Tabela: `user_locations`
3. SQL Query:
```sql
SELECT 
  ul.user_id,
  p.full_name,
  ul.latitude,
  ul.longitude,
  ul.updated_at
FROM user_locations ul
LEFT JOIN profiles p ON p.id = ul.user_id
ORDER BY ul.updated_at DESC;
```

### Ver Subscriptions Ativas (Console do Navegador):
```javascript
// Cole no Console (F12):
supabase.getChannels().map(c => c.topic)
// Deve mostrar: ["location:USER_ID"]
```

### Forçar Envio Manual de Localização:
```javascript
// Cole no Console como Motoboy (F12):
navigator.geolocation.getCurrentPosition(async (pos) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc('upsert_user_location', {
    p_user_id: user.id,
    p_latitude: pos.coords.latitude,
    p_longitude: pos.coords.longitude,
    p_accuracy: pos.coords.accuracy,
    p_speed: pos.coords.speed,
    p_heading: pos.coords.heading
  });
  console.log('Localização enviada:', error || 'Sucesso!');
});
```

---

## 🐛 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema 1: "Aguardando localização do motoboy..." para sempre

**Causa:** Motoboy não clicou em "Ficar Online"

**Solução:**
1. Como motoboy, clique em "Ficar Online"
2. Veja se o LocationTracker fica verde
3. Aguarde 2 segundos
4. Verifique no card Debug se localização foi salva

---

### Problema 2: Localização não atualiza no mapa

**Causa:** Realtime não habilitado ou subscription não conectada

**Solução:**
1. Execute FIX_REALTIME.sql novamente
2. Recarregue AMBAS as abas (motoboy e empresa)
3. Console (F12) não deve ter erros de subscription

---

### Problema 3: GPS impreciso

**Causa:** Navegador/dispositivo com GPS fraco

**Solução:**
- Teste em dispositivo real (celular)
- Ative localização de alta precisão
- Teste em área aberta (não em prédio)

---

## 📊 CHECKLIST DE VALIDAÇÃO

Antes de considerar funcionando:

- [ ] Executei FIX_REALTIME.sql
- [ ] Recarreguei as páginas (Ctrl+Shift+R)
- [ ] Card "Debug - Localização" aparece
- [ ] Cliquei em "Testar Enviar Localização Agora"
- [ ] Toast "Localização enviada!" apareceu
- [ ] Card mostra "✅ Localização Salva no Supabase"
- [ ] Como empresa, mapa carrega com pin do motoboy
- [ ] Sem erros no Console (F12)
- [ ] Tabela `user_locations` tem registros no Supabase

---

## 🎯 PRÓXIMOS PASSOS

Se tudo funcionar:
1. ✅ Remova o card "LocationDebug" (é só para teste)
2. ✅ Chat vai atualizar em tempo real
3. ✅ Rastreamento vai funcionar
4. ✅ Sistema completo!

Se NÃO funcionar:
1. ❌ Copie o erro exato do Console (F12)
2. ❌ Tire print da tabela `user_locations` no Supabase
3. ❌ Me envie para análise

---

**Execute FIX_REALTIME.sql agora e teste! 🚀**
