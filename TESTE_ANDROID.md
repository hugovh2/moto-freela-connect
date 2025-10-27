# 🧪 Checklist de Testes - Android

## 📋 **TESTES OBRIGATÓRIOS**

### 1️⃣ **Autenticação**
- [ ] Fazer login com email/senha
- [ ] Registrar novo usuário
- [ ] Logout funciona corretamente
- [ ] Sessão persiste após fechar app
- [ ] Token refresh automático funciona

**Como testar:**
1. Abrir app
2. Fazer login
3. Fechar app completamente
4. Reabrir app
5. Verificar se continua logado

---

### 2️⃣ **Geolocalização GPS**
- [ ] Permissão de localização é solicitada
- [ ] GPS captura localização atual
- [ ] Localização é enviada ao Supabase
- [ ] Rastreamento contínuo funciona
- [ ] Precisão está adequada (< 50m)

**Como testar:**
1. Abrir app como motoboy
2. Iniciar uma corrida
3. Verificar ícone de localização no app
4. Mover-se fisicamente
5. Ver se localização atualiza no mapa

**Verificar no Supabase:**
```sql
SELECT * FROM user_locations 
WHERE user_id = 'seu_user_id' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

### 3️⃣ **Chat em Tempo Real**
- [ ] Enviar mensagem de texto
- [ ] Receber mensagens instantaneamente
- [ ] Compartilhar localização no chat
- [ ] Indicador de digitação funciona
- [ ] Marcar mensagens como lidas

**Como testar:**
1. Criar uma corrida
2. Aceitar como motoboy
3. Abrir chat
4. Enviar mensagens de ambos os lados
5. Compartilhar localização
6. Verificar sincronização

---

### 4️⃣ **Sistema de Avaliações**
- [ ] Avaliar com estrelas (1-5)
- [ ] Adicionar comentário
- [ ] Selecionar tags
- [ ] Avaliação rápida funciona
- [ ] Média atualiza no perfil

**Como testar:**
1. Completar uma corrida
2. Avaliar o outro usuário
3. Verificar se avaliação aparece no perfil
4. Calcular média manualmente
5. Comparar com valor exibido

---

### 5️⃣ **Upload de Documentos**
- [ ] Tirar foto da CNH
- [ ] Upload da CNH funciona
- [ ] Tirar foto do CRLV
- [ ] Upload do CRLV funciona
- [ ] Selfie de verificação
- [ ] Foto do veículo

**Como testar:**
1. Ir para perfil de motoboy
2. Acessar "Documentos"
3. Tirar/enviar cada documento
4. Verificar upload no Supabase Storage
5. Confirmar URLs corretas

**Verificar no Supabase:**
```sql
SELECT * FROM profiles 
WHERE id = 'seu_user_id';
-- Verificar campos: cnh_url, crlv_url, etc.
```

---

### 6️⃣ **Câmera**
- [ ] Permissão de câmera é solicitada
- [ ] Abrir câmera nativa
- [ ] Capturar foto
- [ ] Foto é processada corretamente
- [ ] Selecionar da galeria funciona

**Como testar:**
1. Tentar enviar documento
2. Selecionar "Tirar foto"
3. Capturar imagem
4. Verificar preview
5. Confirmar upload

---

### 7️⃣ **Notificações Push**
- [ ] Permissão de notificação solicitada
- [ ] Receber notificação de nova corrida
- [ ] Notificação de mensagem nova
- [ ] Notificação de avaliação
- [ ] Clicar na notificação abre app

**Como testar:**
1. Garantir permissão concedida
2. Criar corrida de outro dispositivo
3. Verificar notificação recebida
4. Clicar na notificação
5. App abre na tela correta

---

### 8️⃣ **Feedback Háptico**
- [ ] Vibração ao aceitar corrida
- [ ] Vibração ao receber mensagem
- [ ] Vibração em alertas
- [ ] Feedback em botões importantes

**Como testar:**
1. Aceitar uma corrida
2. Sentir vibração
3. Receber mensagem
4. Sentir vibração

---

### 9️⃣ **Status de Rede**
- [ ] App detecta quando offline
- [ ] Mensagem de "sem conexão"
- [ ] Reconexão automática
- [ ] Sincronização ao voltar online

**Como testar:**
1. Usar app normalmente
2. Ativar modo avião
3. Ver mensagem de offline
4. Desativar modo avião
5. Ver reconexão automática

---

### 🔟 **Sistema de Gamificação**
- [ ] Ganhar XP ao completar corrida
- [ ] Subir de nível
- [ ] Desbloquear badges
- [ ] Ver progresso no perfil

**Como testar:**
1. Completar corridas
2. Verificar XP ganho
3. Acompanhar progresso de nível
4. Ver badges desbloqueados

---

## 🎯 **TESTES DE FLUXO COMPLETO**

### **Fluxo: Empresa contrata motoboy**
1. [ ] Empresa faz login
2. [ ] Cria nova corrida
3. [ ] Define origem e destino
4. [ ] Publica corrida
5. [ ] Motoboy recebe notificação
6. [ ] Motoboy aceita corrida
7. [ ] Chat é aberto
8. [ ] Localização é rastreada
9. [ ] Motoboy completa corrida
10. [ ] Ambos avaliam um ao outro
11. [ ] XP é creditado

### **Fluxo: Motoboy busca corrida**
1. [ ] Motoboy faz login
2. [ ] Vê corridas disponíveis
3. [ ] Filtra por distância
4. [ ] Seleciona corrida
5. [ ] Vê detalhes (mapa, valor)
6. [ ] Aceita corrida
7. [ ] Recebe confirmação
8. [ ] Inicia GPS
9. [ ] Chat com empresa
10. [ ] Completa entrega
11. [ ] Recebe avaliação

---

## 🐛 **TESTES DE ERRO**

### **Cenários de Falha**
- [ ] Login com credenciais inválidas
- [ ] Sem permissão de GPS
- [ ] Sem permissão de câmera
- [ ] Upload com arquivo muito grande
- [ ] Enviar mensagem offline
- [ ] Aceitar corrida já aceita
- [ ] Avaliar sem completar corrida

**Comportamento esperado:**
- Mensagens de erro claras
- App não trava
- Usuário é orientado sobre o problema
- Opção de tentar novamente

---

## 📊 **PERFORMANCE**

### **Métricas a Verificar**
- [ ] App abre em < 3 segundos
- [ ] GPS obtém localização em < 5 segundos
- [ ] Mensagens chegam em < 1 segundo
- [ ] Upload de foto < 10 segundos
- [ ] Interface responde rapidamente
- [ ] Sem travamentos ou ANRs

---

## 🔒 **SEGURANÇA**

### **Validações**
- [ ] Token JWT é armazenado com segurança
- [ ] Dados sensíveis não vazam nos logs
- [ ] HTTPS em todas as requisições
- [ ] Permissões mínimas necessárias
- [ ] Logout limpa dados locais

---

## ✅ **CRITÉRIOS DE ACEITAÇÃO**

Para considerar a migração bem-sucedida:

1. **Funcional:** Todos os testes obrigatórios passam
2. **Performance:** Métricas dentro do esperado
3. **Estabilidade:** Sem crashes em uso normal
4. **Usabilidade:** Interface responsiva e intuitiva
5. **Segurança:** Dados protegidos adequadamente

---

## 📱 **DISPOSITIVOS TESTADOS**

### **Mínimo Recomendado**
- [ ] Android 7.0+ (API 24)
- [ ] 2GB RAM
- [ ] GPS disponível
- [ ] Câmera traseira

### **Configurações de Teste**
- [ ] Diferentes versões Android (7, 8, 9, 10, 11+)
- [ ] Diferentes fabricantes (Samsung, Xiaomi, Motorola)
- [ ] Diferentes tamanhos de tela
- [ ] WiFi vs 4G/5G

---

## 🚀 **COMANDOS ÚTEIS**

### **Build e Deploy**
```bash
# Build produção
npm run build

# Sync com Android
npx cap sync android

# Abrir Android Studio
npx cap open android

# Build mobile completo
npm run build:mobile

# Rodar direto no Android
npm run android
```

### **Debug**
```bash
# Ver logs do Android
npx cap run android -l

# Inspecionar WebView
chrome://inspect
```

---

## 📝 **RELATÓRIO DE BUGS**

Ao encontrar bugs, documentar:

1. **Descrição:** O que aconteceu?
2. **Passos:** Como reproduzir?
3. **Esperado:** O que deveria acontecer?
4. **Dispositivo:** Modelo e Android version
5. **Logs:** Mensagens de erro
6. **Screenshots:** Se aplicável

---

**Última atualização:** $(date)
**Status:** Pronto para testes
