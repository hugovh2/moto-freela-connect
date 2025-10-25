# 🚨 CHECKLIST - RASTREAMENTO EM TEMPO REAL

## ⚠️ PASSO 1: EXECUTOU O SQL? (OBRIGATÓRIO)

**Você JÁ executou o `FIX_REALTIME.sql`?**

- [ ] SIM - Vá para o Passo 2
- [ ] NÃO - **EXECUTE AGORA:**
  1. https://supabase.com/dashboard/project/rinszzwdteaytefdwwnc/sql/new
  2. Copie TODO o conteúdo de: `supabase/FIX_REALTIME.sql`
  3. Cole e Execute (RUN)
  4. Aguarde ver: "✅ REALTIME CONFIGURADO COM SUCESSO!"

---

## 🧪 PASSO 2: TESTAR SE MOTOBOY ENVIA LOCALIZAÇÃO

### Como Motoboy:
1. Login como motoboy
2. Recarregue (Ctrl+Shift+R)
3. Veja o card **"Debug - Localização"**
4. Clique em: **"Testar Enviar Localização Agora"**

### ✅ DEVE MOSTRAR:
```
✅ Localização Salva no Supabase
Latitude: -25.480407
Longitude: -49.280617
Precisão: XXXm
Última atualização: HH:MM:SS
```

### ❌ SE DER ERRO:
- Copie o erro exato e me envie
- Execute o `FIX_REALTIME.sql` novamente

---

## 🏢 PASSO 3: TESTAR SE EMPRESA VÊ

### Como Empresa:
1. Login como empresa (outra aba/navegador)
2. Aguarde motoboy aceitar uma corrida
3. Abra a corrida
4. Veja "Rastreamento em Tempo Real"

### ✅ DEVE MOSTRAR:
- Mapa do Google com pin do motoboy
- Latitude e longitude
- "Tempo Estimado" (mesmo que mock)

---

## 🐛 SE AINDA MOSTRAR "Aguardando localização..."

Execute este SQL para verificar:

```sql
-- Verificar se tabela existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'user_locations'
);

-- Ver localizações salvas
SELECT * FROM user_locations ORDER BY updated_at DESC LIMIT 5;

-- Ver se o motoboy específico tem localização
SELECT 
  ul.*,
  p.full_name
FROM user_locations ul
LEFT JOIN profiles p ON p.id = ul.user_id
WHERE ul.user_id = 'ID_DO_MOTOBOY_AQUI';
```

---

## 📞 PRÓXIMO PASSO

Me diga:
1. ✅ Executou o `FIX_REALTIME.sql`? (SIM/NÃO)
2. ✅ Card "Debug - Localização" mostra "✅ Localização Salva"? (SIM/NÃO)
3. ❌ Se NÃO, qual erro aparece?

Com essas informações, vou criar a solução específica!
