# Checklist de QA - Fluxo Motoboy

**Versão:** 1.2.0  
**Data:** 24 de Outubro de 2025  
**Responsável:** _____________  
**Ambiente:** [ ] Dev [ ] Staging [ ] Produção

---

## 📱 Pré-requisitos

- [ ] App instalado em dispositivo Android (API 30+)
- [ ] App instalado em dispositivo iOS (iOS 14+)
- [ ] Conexão com internet estável
- [ ] Conta de teste motoboy criada
- [ ] Permissões de localização disponíveis no dispositivo

---

## 🎨 1. Landing Page - Botão "Sou Motoboy"

### Tema Claro
- [ ] Botão "Sou Motoboy" é visível
- [ ] Texto é legível (não está branco/transparente)
- [ ] Ícone de moto é visível
- [ ] Borda do botão é visível
- [ ] Hover/press mostra feedback visual
- [ ] Contraste adequado (WCAG AA)

### Tema Escuro
- [ ] Botão "Sou Motoboy" é visível
- [ ] Texto é legível (não está preto/transparente)
- [ ] Ícone de moto é visível
- [ ] Borda do botão é visível
- [ ] Hover/press mostra feedback visual
- [ ] Contraste adequado (WCAG AA)

### Funcionalidade
- [ ] Clicar no botão navega para `/auth`
- [ ] Não há delay perceptível
- [ ] Não há erros no console
- [ ] Animação de transição funciona

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🔐 2. Autenticação - Criar Conta Motoboy

### Formulário de Signup
- [ ] Campos de nome, email e senha são visíveis
- [ ] Radio button "Motoboy" é selecionável
- [ ] Ícone de moto aparece ao lado de "Motoboy"
- [ ] Validações em tempo real funcionam
- [ ] Mensagens de erro são claras (pt-BR)

### Validações
- [ ] Email inválido mostra erro
- [ ] Senha < 6 caracteres mostra erro
- [ ] Campos vazios mostram erro
- [ ] Email já cadastrado mostra erro apropriado

### Criação de Conta
- [ ] Botão "Criar Conta" funciona
- [ ] Spinner aparece durante processamento
- [ ] Botão fica desabilitado durante processamento
- [ ] Toast de sucesso aparece
- [ ] Redirecionamento para `/motoboy` acontece
- [ ] Não há crashes durante o processo

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🔑 3. Autenticação - Login Motoboy

### Formulário de Login
- [ ] Campos de email e senha são visíveis
- [ ] Botão "Entrar" funciona
- [ ] Spinner aparece durante processamento
- [ ] Botão fica desabilitado durante processamento

### Login Bem-sucedido
- [ ] Toast de sucesso aparece
- [ ] Redirecionamento para `/motoboy` acontece
- [ ] Não há crashes durante o processo
- [ ] Sessão é mantida ao recarregar página

### Login com Erro
- [ ] Credenciais inválidas mostram erro claro
- [ ] Usuário não encontrado mostra erro apropriado
- [ ] Erro de rede mostra mensagem adequada
- [ ] Não há crashes em caso de erro

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🏠 4. Dashboard Motoboy - Inicialização

### Carregamento Inicial
- [ ] Dashboard carrega sem crashes
- [ ] Título "Painel do Motoboy" é visível
- [ ] Nome do motoboy aparece no header
- [ ] Avatar/iniciais aparecem corretamente
- [ ] Loading state é exibido durante carregamento

### Inicialização de Serviços
- [ ] Solicitação de permissão de localização aparece
- [ ] Mensagem é clara e em pt-BR
- [ ] Não há crashes se permissão for negada
- [ ] Modo limitado funciona sem permissões
- [ ] Retry funciona após conceder permissão

### Estatísticas
- [ ] "Ganhos Totais" é exibido
- [ ] "Corridas Totais" é exibido
- [ ] "Avaliação Média" é exibido
- [ ] "Taxa de Sucesso" é exibido
- [ ] Valores são formatados corretamente (R$, %)

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 📍 5. Permissões de Localização

### Permissão Concedida
- [ ] Toast de sucesso aparece
- [ ] Serviços de localização inicializam
- [ ] Posição atual é exibida no mapa
- [ ] Corridas próximas são carregadas
- [ ] Toggle "Ficar Online" funciona

### Permissão Negada
- [ ] Toast de aviso aparece
- [ ] Mensagem explica como habilitar
- [ ] Dashboard continua funcionando (modo limitado)
- [ ] Não há crashes
- [ ] Botão "Solicitar Permissão" está disponível

### Permissão Negada Permanentemente
- [ ] Guia para configurações é exibido
- [ ] Instruções são claras (passo a passo)
- [ ] Dashboard continua funcionando
- [ ] Não há crashes

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🚦 6. Toggle de Disponibilidade

### Ficar Online
- [ ] Botão "Ficar Online" funciona
- [ ] Botão muda para "Ficar Offline"
- [ ] Badge mostra "Ativo"
- [ ] Toast de sucesso aparece
- [ ] Corridas próximas começam a aparecer
- [ ] Não há crashes

### Ficar Offline
- [ ] Botão "Ficar Offline" funciona
- [ ] Botão muda para "Ficar Online"
- [ ] Badge mostra "Inativo"
- [ ] Toast de sucesso aparece
- [ ] Corridas próximas param de aparecer
- [ ] Não há crashes

### Sem Permissões
- [ ] Tentar ficar online solicita permissão
- [ ] Mensagem de erro é clara
- [ ] Opção de habilitar permissão é oferecida
- [ ] Não há crashes

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 📦 7. Visualização de Corridas

### Lista de Corridas Disponíveis
- [ ] Seção "Corridas Disponíveis" é visível
- [ ] Corridas são exibidas em cards
- [ ] Informações completas (origem, destino, preço)
- [ ] Badge com quantidade de corridas
- [ ] Loading state durante carregamento
- [ ] Mensagem quando não há corridas

### Minhas Corridas Ativas
- [ ] Seção "Minhas Corridas Ativas" é visível
- [ ] Corridas aceitas são exibidas
- [ ] Status é exibido corretamente
- [ ] Ações disponíveis (iniciar, concluir)
- [ ] Mensagem quando não há corridas ativas

### Corridas Próximas (com localização)
- [ ] Seção "Corridas Próximas" aparece quando online
- [ ] Corridas são ordenadas por distância
- [ ] Badge mostra quantidade de corridas próximas
- [ ] Distância é exibida corretamente

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🗺️ 8. Visualização em Mapa

### Troca de Visualização
- [ ] Botões "Lista" e "Mapa" são visíveis
- [ ] Clicar em "Mapa" mostra o mapa
- [ ] Clicar em "Lista" volta para lista
- [ ] Transição é suave
- [ ] Não há crashes ao trocar

### Mapa
- [ ] Mapa do Google carrega corretamente
- [ ] Posição atual do motoboy é exibida
- [ ] Marcadores de corridas são visíveis
- [ ] Clicar em marcador mostra informações
- [ ] Zoom e pan funcionam
- [ ] Não há crashes

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🔄 9. Tratamento de Erros

### Erro de Rede
- [ ] Sem internet mostra mensagem clara
- [ ] Opção de tentar novamente está disponível
- [ ] Dashboard não crasha
- [ ] Dados em cache são exibidos (se disponível)

### Erro de Inicialização
- [ ] Erro mostra mensagem clara
- [ ] Botão "Tentar Novamente" está disponível
- [ ] Retry funciona corretamente
- [ ] Não há loops infinitos de retry

### Perfil Incompleto
- [ ] Onboarding é exibido
- [ ] Fluxo guiado funciona
- [ ] Validações funcionam
- [ ] Salvamento funciona
- [ ] Redirecionamento para dashboard após completar

### Sessão Expirada
- [ ] Mensagem de sessão expirada aparece
- [ ] Redirecionamento para login acontece
- [ ] Não há crashes

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 📱 10. Testes em Dispositivos

### Android (Emulador)
- [ ] App instala sem erros
- [ ] Todas as funcionalidades funcionam
- [ ] Permissões funcionam corretamente
- [ ] Não há crashes
- [ ] Performance aceitável

### Android (Dispositivo Físico)
- [ ] App instala sem erros
- [ ] Todas as funcionalidades funcionam
- [ ] GPS funciona corretamente
- [ ] Permissões funcionam corretamente
- [ ] Não há crashes
- [ ] Performance aceitável

### iOS (Simulador)
- [ ] App instala sem erros
- [ ] Todas as funcionalidades funcionam
- [ ] Permissões funcionam corretamente
- [ ] Não há crashes
- [ ] Performance aceitável

### iOS (Dispositivo Físico)
- [ ] App instala sem erros
- [ ] Todas as funcionalidades funcionam
- [ ] GPS funciona corretamente
- [ ] Permissões funcionam corretamente
- [ ] Não há crashes
- [ ] Performance aceitável

**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🔄 11. Fluxo Completo (End-to-End)

### Cenário 1: Novo Motoboy
1. [ ] Abrir app na landing page
2. [ ] Clicar em "Sou Motoboy"
3. [ ] Criar conta com role motoboy
4. [ ] Completar onboarding (se necessário)
5. [ ] Conceder permissão de localização
6. [ ] Dashboard carrega com sucesso
7. [ ] Ficar online
8. [ ] Visualizar corridas disponíveis
9. [ ] Aceitar uma corrida
10. [ ] Iniciar corrida
11. [ ] Concluir corrida
12. [ ] Fazer logout

**Status:** [ ] Passou [ ] Falhou  
**Observações:**
```
_______________________________________________________
_______________________________________________________
```

### Cenário 2: Motoboy Existente
1. [ ] Abrir app na landing page
2. [ ] Fazer login como motoboy
3. [ ] Dashboard carrega com sucesso
4. [ ] Estatísticas são exibidas corretamente
5. [ ] Ficar online
6. [ ] Visualizar corridas próximas
7. [ ] Trocar para visualização em mapa
8. [ ] Voltar para lista
9. [ ] Ficar offline
10. [ ] Fazer logout

**Status:** [ ] Passou [ ] Falhou  
**Observações:**
```
_______________________________________________________
_______________________________________________________
```

### Cenário 3: Permissões Negadas
1. [ ] Fazer login como motoboy
2. [ ] Negar permissão de localização
3. [ ] Dashboard carrega em modo limitado
4. [ ] Mensagem de aviso é exibida
5. [ ] Tentar ficar online
6. [ ] Solicitação de permissão aparece
7. [ ] Conceder permissão
8. [ ] Serviços inicializam com sucesso
9. [ ] Ficar online funciona

**Status:** [ ] Passou [ ] Falhou  
**Observações:**
```
_______________________________________________________
_______________________________________________________
```

---

## 🐛 Bugs Encontrados

### Bug #1
**Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo  
**Descrição:**
```
_______________________________________________________
_______________________________________________________
```
**Passos para Reproduzir:**
```
1. _________________________________________________
2. _________________________________________________
3. _________________________________________________
```
**Comportamento Esperado:**
```
_______________________________________________________
```
**Comportamento Atual:**
```
_______________________________________________________
```

### Bug #2
**Severidade:** [ ] Crítico [ ] Alto [ ] Médio [ ] Baixo  
**Descrição:**
```
_______________________________________________________
_______________________________________________________
```

---

## ✅ Resumo Final

**Total de Testes:** _____  
**Testes Passados:** _____  
**Testes Falhados:** _____  
**Taxa de Sucesso:** _____%

**Aprovado para Produção:** [ ] Sim [ ] Não

**Assinatura:** _____________  
**Data:** ___/___/______

---

**Notas Adicionais:**
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
_______________________________________________________
```
