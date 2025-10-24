# Instruções para Testar as Correções do Fluxo Motoboy

**Versão:** 1.2.0  
**Data:** 24 de Outubro de 2025

---

## 📋 Visão Geral

Este documento fornece instruções passo a passo para testar todas as correções implementadas no fluxo motoboy, incluindo:
- Correção do botão "Sou Motoboy" (visibilidade)
- Inicialização segura de serviços
- Tratamento de permissões
- Testes automatizados

---

## 🚀 Configuração Inicial

### 1. Instalar Dependências

```bash
# Instalar dependências do projeto
npm install

# Instalar dependências de teste (opcional, mas recomendado)
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @playwright/test

# Instalar navegadores para Playwright
npx playwright install
```

### 2. Configurar Ambiente

```bash
# Copiar arquivo de ambiente (se necessário)
cp .env.example .env

# Editar .env com suas credenciais Supabase
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Build do Projeto

```bash
# Build para desenvolvimento
npm run dev

# OU Build para mobile
npm run build:mobile
```

---

## 🧪 Executar Testes Automatizados

### Testes Unitários

```bash
# Executar todos os testes unitários
npm run test

# Executar com interface visual
npm run test:ui

# Executar com cobertura
npm run test:coverage

# Executar testes específicos
npm run test -- motoboy-service-init
npm run test -- navigation
npm run test -- error-handler
```

**Resultado Esperado:**
- ✅ Todos os testes devem passar
- ✅ Cobertura mínima de 80% nos módulos testados
- ✅ Sem erros ou warnings

### Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface visual
npm run test:e2e:ui

# Executar teste específico
npx playwright test tests/e2e/motoboy-flow.spec.ts

# Executar em modo debug
npx playwright test --debug
```

**Resultado Esperado:**
- ✅ Todos os cenários devem passar
- ✅ Screenshots/vídeos são gerados para falhas
- ✅ Relatório HTML é gerado

---

## 🌐 Testes Manuais no Navegador

### 1. Testar Botão "Sou Motoboy"

#### Passo 1: Abrir Landing Page
```bash
npm run dev
# Abrir http://localhost:5173
```

#### Passo 2: Verificar Tema Claro
1. Abrir DevTools (F12)
2. Verificar que o botão "Sou Motoboy" está visível
3. Verificar que o texto é legível (não branco/transparente)
4. Verificar que a borda é visível
5. Passar o mouse sobre o botão (hover)
6. Verificar feedback visual

**Checklist:**
- [ ] Botão visível
- [ ] Texto legível
- [ ] Borda visível
- [ ] Hover funciona
- [ ] Sem erros no console

#### Passo 3: Verificar Tema Escuro
1. Abrir DevTools
2. Alternar para tema escuro:
   ```javascript
   document.documentElement.classList.add('dark')
   ```
3. Verificar que o botão continua visível
4. Verificar que o texto é legível (não preto/transparente)
5. Verificar contraste adequado

**Checklist:**
- [ ] Botão visível no tema escuro
- [ ] Texto legível
- [ ] Borda visível
- [ ] Contraste adequado

#### Passo 4: Testar Navegação
1. Clicar no botão "Sou Motoboy"
2. Verificar redirecionamento para `/auth`
3. Verificar que não há erros no console

**Checklist:**
- [ ] Navegação funciona
- [ ] URL muda para /auth
- [ ] Sem erros

---

### 2. Testar Criação de Conta Motoboy

#### Passo 1: Acessar Formulário
```
URL: http://localhost:5173/auth
```

#### Passo 2: Preencher Formulário
1. Clicar na aba "Criar Conta"
2. Preencher:
   - Nome: "João Teste Motoboy"
   - Email: "motoboy.teste@email.com"
   - Senha: "senha123"
3. Selecionar radio button "Motoboy"
4. Verificar que o ícone de moto aparece

**Checklist:**
- [ ] Formulário visível
- [ ] Radio "Motoboy" selecionável
- [ ] Ícone de moto aparece
- [ ] Validações funcionam

#### Passo 3: Criar Conta
1. Clicar em "Criar Conta"
2. Observar:
   - Spinner aparece
   - Botão fica desabilitado
   - Toast de sucesso aparece
   - Redirecionamento para `/motoboy`

**Checklist:**
- [ ] Spinner aparece
- [ ] Botão desabilitado
- [ ] Toast de sucesso
- [ ] Redirecionamento funciona
- [ ] Sem crashes

---

### 3. Testar Dashboard Motoboy

#### Passo 1: Acessar Dashboard
```
URL: http://localhost:5173/motoboy
(ou será redirecionado após login)
```

#### Passo 2: Verificar Carregamento
1. Observar loading state
2. Verificar que dashboard carrega
3. Verificar elementos:
   - Título "Painel do Motoboy"
   - Nome do usuário
   - Avatar
   - Estatísticas (4 cards)
   - Seções de corridas

**Checklist:**
- [ ] Dashboard carrega sem crashes
- [ ] Título visível
- [ ] Nome do usuário aparece
- [ ] 4 cards de estatísticas
- [ ] Sem erros no console

#### Passo 3: Testar Permissões (Navegador)
1. Quando solicitado, permitir localização
2. Verificar toast de sucesso
3. Verificar que serviços inicializam

**OU**

1. Quando solicitado, negar localização
2. Verificar toast de aviso
3. Verificar que dashboard continua funcionando
4. Verificar mensagem de modo limitado

**Checklist:**
- [ ] Solicitação de permissão aparece
- [ ] Permissão concedida: serviços inicializam
- [ ] Permissão negada: modo limitado funciona
- [ ] Sem crashes em ambos os casos

---

## 📱 Testes em Dispositivos Móveis

### Android

#### Passo 1: Build e Sync
```bash
# Build do projeto
npm run build

# Sync com Capacitor
npm run cap:sync

# Abrir no Android Studio
npm run cap:open:android
```

#### Passo 2: Executar no Emulador
1. Abrir Android Studio
2. Selecionar emulador (API 30+)
3. Clicar em "Run"
4. Aguardar instalação

#### Passo 3: Testar Permissões Nativas
1. Fazer login como motoboy
2. Quando solicitado, permitir localização
3. Verificar que GPS funciona
4. Verificar que corridas próximas aparecem

**Checklist:**
- [ ] App instala sem erros
- [ ] Solicitação de permissão nativa aparece
- [ ] GPS funciona
- [ ] Corridas próximas carregam
- [ ] Sem crashes

#### Passo 4: Testar Negação de Permissão
1. Fazer logout
2. Desinstalar app
3. Reinstalar app
4. Fazer login
5. Negar permissão de localização
6. Verificar modo limitado
7. Tentar ficar online
8. Verificar mensagem de erro
9. Ir para configurações e habilitar
10. Voltar ao app e tentar novamente

**Checklist:**
- [ ] Modo limitado funciona
- [ ] Mensagem de erro clara
- [ ] Guia para configurações funciona
- [ ] Retry funciona após habilitar
- [ ] Sem crashes

---

### iOS

#### Passo 1: Build e Sync
```bash
# Build do projeto
npm run build

# Sync com Capacitor
npm run cap:sync

# Abrir no Xcode
npm run cap:open:ios
```

#### Passo 2: Executar no Simulador
1. Abrir Xcode
2. Selecionar simulador (iOS 14+)
3. Clicar em "Run"
4. Aguardar instalação

#### Passo 3: Testar Permissões (mesmo processo do Android)

**Checklist:**
- [ ] App instala sem erros
- [ ] Permissões funcionam
- [ ] GPS funciona
- [ ] Modo limitado funciona
- [ ] Sem crashes

---

## 🔍 Cenários de Teste Específicos

### Cenário 1: Perfil Incompleto

**Objetivo:** Verificar que onboarding é exibido para perfis incompletos

**Passos:**
1. Criar conta motoboy
2. Não completar onboarding (se implementado)
3. Tentar acessar dashboard
4. Verificar que onboarding é exibido
5. Completar onboarding
6. Verificar redirecionamento para dashboard

**Resultado Esperado:**
- Onboarding é exibido automaticamente
- Validações funcionam
- Salvamento funciona
- Redirecionamento após completar

---

### Cenário 2: Erro de Rede

**Objetivo:** Verificar tratamento de erros de rede

**Passos:**
1. Fazer login como motoboy
2. Abrir DevTools
3. Ir para Network tab
4. Selecionar "Offline"
5. Tentar carregar corridas
6. Verificar mensagem de erro
7. Voltar para "Online"
8. Clicar em "Tentar Novamente"
9. Verificar que corridas carregam

**Resultado Esperado:**
- Mensagem de erro clara
- Botão "Tentar Novamente" disponível
- Retry funciona
- Sem crashes

---

### Cenário 3: Múltiplas Inicializações

**Objetivo:** Verificar que single-flight pattern previne inicializações concorrentes

**Passos:**
1. Fazer login como motoboy
2. Abrir DevTools Console
3. Observar logs de inicialização
4. Verificar que apenas uma inicialização ocorre
5. Procurar por: `[MotoboyServiceInit] Already initializing`

**Resultado Esperado:**
- Apenas uma inicialização
- Logs indicam prevenção de concorrência
- Sem race conditions

---

## 📊 Verificação de Logs

### Console do Navegador

Logs esperados durante inicialização:
```
[MotoboyServiceInit] Starting initialization for: <user-id>
[MotoboyServiceInit] Checking location permissions...
[MotoboyServiceInit] Permissions granted, services can be initialized
[MotoboyServiceInit] Initialization complete: { success: true, ... }
```

### Logs de Erro (se permissão negada):
```
[MotoboyServiceInit] Location permission not granted, requesting...
[MotoboyServiceInit] Limited mode - location services unavailable
```

### Verificar Ausência de Erros:
- ❌ Não deve haver erros de navegação
- ❌ Não deve haver erros de undefined/null
- ❌ Não deve haver erros de permissão não tratados

---

## ✅ Critérios de Aceitação

### Funcionalidade
- [ ] Botão "Sou Motoboy" 100% visível
- [ ] Criação de conta funciona
- [ ] Login funciona
- [ ] Dashboard carrega sem crashes
- [ ] Permissões tratadas corretamente
- [ ] Modo limitado funciona
- [ ] Toggle online/offline funciona
- [ ] Visualização de corridas funciona

### Qualidade
- [ ] Testes unitários passam (80%+ cobertura)
- [ ] Testes E2E passam
- [ ] Sem erros no console
- [ ] Sem crashes reportados
- [ ] Performance aceitável (<3s carregamento)

### UX
- [ ] Mensagens claras em pt-BR
- [ ] Feedback visual em todas as ações
- [ ] Loading states adequados
- [ ] Tratamento de erros amigável

---

## 🐛 Reportar Bugs

Se encontrar bugs durante os testes:

1. **Capturar informações:**
   - Screenshot/vídeo
   - Logs do console
   - Passos para reproduzir
   - Dispositivo/navegador

2. **Documentar no checklist:**
   - Usar seção "Bugs Encontrados" em `QA_MOTOBOY_CHECKLIST.md`

3. **Severidade:**
   - **Crítico:** Crash, perda de dados
   - **Alto:** Funcionalidade principal quebrada
   - **Médio:** Funcionalidade secundária com workaround
   - **Baixo:** Cosmético, sem impacto funcional

---

## 📞 Suporte

**Dúvidas sobre testes:**
- Consultar `MOTOBOY_FIXES_REPORT.md`
- Consultar `QA_MOTOBOY_CHECKLIST.md`
- Verificar logs no console

**Problemas técnicos:**
- Verificar dependências: `npm install`
- Limpar cache: `npm run clean` (se disponível)
- Rebuild: `npm run build`

---

## 🎯 Próximos Passos Após Testes

1. **Se todos os testes passarem:**
   - Marcar checklist como aprovado
   - Preparar para deploy em staging
   - Agendar testes em produção

2. **Se houver falhas:**
   - Documentar bugs encontrados
   - Priorizar correções
   - Re-testar após correções

3. **Monitoramento pós-deploy:**
   - Verificar logs de erro (Sentry)
   - Monitorar métricas de crash
   - Coletar feedback de usuários

---

**Boa sorte com os testes! 🚀**
