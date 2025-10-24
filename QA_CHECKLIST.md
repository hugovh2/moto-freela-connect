# 🧪 Checklist de QA - MotoFreela v1.1.0

## 📋 Cenários de Teste Críticos

### 🔐 Autenticação

#### ✅ Cadastro (Signup)

**Cenário 1: Cadastro bem-sucedido - Motoboy**
- [ ] 1. Abrir app e navegar para `/auth`
- [ ] 2. Clicar na aba "Criar Conta"
- [ ] 3. Preencher:
  - Nome: "João Silva"
  - Email: "joao.motoboy@test.com"
  - Senha: "senha123"
  - Tipo: Motoboy
- [ ] 4. Clicar em "Criar Conta"
- [ ] 5. **Verificar**: Toast "Conta criada com sucesso!"
- [ ] 6. **Verificar**: Redirecionamento para `/motoboy`
- [ ] 7. **Verificar**: App NÃO fecha/crasha
- [ ] 8. **Verificar**: Dashboard do motoboy carrega corretamente

**Cenário 2: Cadastro bem-sucedido - Empresa**
- [ ] 1. Abrir app e navegar para `/auth`
- [ ] 2. Clicar na aba "Criar Conta"
- [ ] 3. Preencher:
  - Nome: "Empresa Teste Ltda"
  - Email: "empresa@test.com"
  - Senha: "senha123"
  - Tipo: Empresa
- [ ] 4. Clicar em "Criar Conta"
- [ ] 5. **Verificar**: Toast "Conta criada com sucesso!"
- [ ] 6. **Verificar**: Redirecionamento para `/company`
- [ ] 7. **Verificar**: App NÃO fecha/crasha
- [ ] 8. **Verificar**: Dashboard da empresa carrega corretamente

**Cenário 3: Validações de cadastro**
- [ ] 1. Tentar cadastrar sem preencher nome
  - **Esperado**: Toast "Nome completo é obrigatório."
- [ ] 2. Tentar cadastrar com email inválido ("teste@")
  - **Esperado**: Toast "Email inválido."
- [ ] 3. Tentar cadastrar com senha curta ("12345")
  - **Esperado**: Toast "A senha deve ter pelo menos 6 caracteres."
- [ ] 4. Tentar cadastrar com email já existente
  - **Esperado**: Toast "Este email já está em uso. Tente fazer login."

**Cenário 4: Prevenção de double-submit**
- [ ] 1. Preencher formulário de cadastro
- [ ] 2. Clicar rapidamente 2x no botão "Criar Conta"
- [ ] 3. **Verificar**: Apenas 1 requisição é enviada
- [ ] 4. **Verificar**: Botão fica desabilitado durante processamento

---

#### ✅ Login (Signin)

**Cenário 5: Login bem-sucedido - Motoboy**
- [ ] 1. Navegar para `/auth`
- [ ] 2. Na aba "Entrar", preencher:
  - Email: "joao.motoboy@test.com"
  - Senha: "senha123"
- [ ] 3. Clicar em "Entrar"
- [ ] 4. **Verificar**: Toast "Login realizado com sucesso!"
- [ ] 5. **Verificar**: Redirecionamento para `/motoboy`
- [ ] 6. **Verificar**: App NÃO fecha/crasha
- [ ] 7. **Verificar**: Dados do perfil carregam corretamente

**Cenário 6: Login bem-sucedido - Empresa**
- [ ] 1. Navegar para `/auth`
- [ ] 2. Na aba "Entrar", preencher:
  - Email: "empresa@test.com"
  - Senha: "senha123"
- [ ] 3. Clicar em "Entrar"
- [ ] 4. **Verificar**: Toast "Login realizado com sucesso!"
- [ ] 5. **Verificar**: Redirecionamento para `/company`
- [ ] 6. **Verificar**: App NÃO fecha/crasha

**Cenário 7: Login com credenciais inválidas**
- [ ] 1. Tentar login com email inexistente
  - **Esperado**: Toast "Email ou senha incorretos."
- [ ] 2. Tentar login com senha errada
  - **Esperado**: Toast "Email ou senha incorretos."
- [ ] 3. **Verificar**: App permanece na tela de login

**Cenário 8: Validações de login**
- [ ] 1. Tentar login sem preencher email
  - **Esperado**: Toast "Email é obrigatório."
- [ ] 2. Tentar login sem preencher senha
  - **Esperado**: Toast "Senha é obrigatório."

---

#### ✅ Sessão e Persistência

**Cenário 9: Sessão persistente**
- [ ] 1. Fazer login com sucesso
- [ ] 2. Fechar o app completamente
- [ ] 3. Reabrir o app
- [ ] 4. **Verificar**: Usuário continua logado
- [ ] 5. **Verificar**: Redirecionado automaticamente para dashboard correto

**Cenário 10: Refresh token automático**
- [ ] 1. Fazer login
- [ ] 2. Aguardar 50 minutos (ou simular token expirado)
- [ ] 3. Fazer uma ação que requer autenticação
- [ ] 4. **Verificar**: Token é renovado automaticamente
- [ ] 5. **Verificar**: Ação é completada sem erro
- [ ] 6. **Verificar**: Usuário NÃO é deslogado

**Cenário 11: Redirecionamento ao acessar /auth já logado**
- [ ] 1. Fazer login como motoboy
- [ ] 2. Navegar manualmente para `/auth`
- [ ] 3. **Verificar**: Redirecionado automaticamente para `/motoboy`
- [ ] 4. Fazer logout e login como empresa
- [ ] 5. Navegar manualmente para `/auth`
- [ ] 6. **Verificar**: Redirecionado automaticamente para `/company`

---

#### ✅ Logout

**Cenário 12: Logout bem-sucedido**
- [ ] 1. Fazer login
- [ ] 2. Clicar no botão de logout (ícone LogOut)
- [ ] 3. **Verificar**: Toast "Logout realizado com sucesso"
- [ ] 4. **Verificar**: Redirecionamento para `/`
- [ ] 5. **Verificar**: Tokens removidos do storage
- [ ] 6. **Verificar**: Ao tentar acessar `/company` ou `/motoboy`, é redirecionado para `/auth`

---

### 🛡️ Proteção de Rotas

**Cenário 13: Acesso não autorizado - Sem login**
- [ ] 1. Sem fazer login, tentar acessar `/company`
- [ ] 2. **Verificar**: Redirecionado para `/auth`
- [ ] 3. Tentar acessar `/motoboy`
- [ ] 4. **Verificar**: Redirecionado para `/auth`

**Cenário 14: Acesso não autorizado - Role incorreto**
- [ ] 1. Fazer login como motoboy
- [ ] 2. Tentar acessar `/company` manualmente
- [ ] 3. **Verificar**: Redirecionado para `/motoboy`
- [ ] 4. Fazer logout e login como empresa
- [ ] 5. Tentar acessar `/motoboy` manualmente
- [ ] 6. **Verificar**: Redirecionado para `/company`

**Cenário 15: Loading state durante verificação**
- [ ] 1. Fazer login
- [ ] 2. Navegar para dashboard
- [ ] 3. **Verificar**: Tela de loading aparece brevemente
- [ ] 4. **Verificar**: Mensagem "Verificando autenticação..."
- [ ] 5. **Verificar**: Spinner animado visível

---

### 📱 Dashboards

#### ✅ Dashboard Empresa

**Cenário 16: Carregamento do dashboard**
- [ ] 1. Fazer login como empresa
- [ ] 2. **Verificar**: Header com nome da empresa
- [ ] 3. **Verificar**: Cards de estatísticas carregam
- [ ] 4. **Verificar**: Botão "Nova Entrega" visível
- [ ] 5. **Verificar**: Lista de serviços carrega (ou mensagem "Primeira entrega?")

**Cenário 17: Tratamento de erro ao carregar serviços**
- [ ] 1. Simular erro de rede (desconectar internet)
- [ ] 2. Fazer login como empresa
- [ ] 3. **Verificar**: Toast "Erro ao carregar serviços"
- [ ] 4. **Verificar**: App NÃO crasha
- [ ] 5. Reconectar internet e recarregar
- [ ] 6. **Verificar**: Serviços carregam normalmente

#### ✅ Dashboard Motoboy

**Cenário 18: Carregamento do dashboard**
- [ ] 1. Fazer login como motoboy
- [ ] 2. **Verificar**: Header com nome do motoboy
- [ ] 3. **Verificar**: Cards de estatísticas carregam
- [ ] 4. **Verificar**: Toggle "Ficar Online/Offline" visível
- [ ] 5. **Verificar**: Seções "Minhas Corridas Ativas" e "Corridas Disponíveis"

**Cenário 19: Toggle de disponibilidade**
- [ ] 1. Fazer login como motoboy
- [ ] 2. Clicar em "Ficar Online"
- [ ] 3. **Verificar**: Toast "Você está online!"
- [ ] 4. **Verificar**: Botão muda para "Ficar Offline"
- [ ] 5. **Verificar**: Badge mostra "Ativo"
- [ ] 6. Clicar em "Ficar Offline"
- [ ] 7. **Verificar**: Toast "Você está offline."
- [ ] 8. **Verificar**: Badge mostra "Inativo"

---

### 🔄 Fluxos Interrompidos

**Cenário 20: Voltar durante cadastro**
- [ ] 1. Iniciar cadastro
- [ ] 2. Preencher metade do formulário
- [ ] 3. Clicar no botão voltar do navegador/app
- [ ] 4. **Verificar**: App NÃO crasha
- [ ] 5. **Verificar**: Retorna à tela anterior

**Cenário 21: Trocar de app durante login**
- [ ] 1. Iniciar login
- [ ] 2. Clicar em "Entrar"
- [ ] 3. Imediatamente trocar para outro app (Android: Recent Apps)
- [ ] 4. Aguardar 5 segundos
- [ ] 5. Voltar para MotoFreela
- [ ] 6. **Verificar**: Login completa ou mostra erro apropriado
- [ ] 7. **Verificar**: App NÃO crasha

**Cenário 22: Perda de conexão durante operação**
- [ ] 1. Fazer login
- [ ] 2. Desconectar internet
- [ ] 3. Tentar criar serviço ou aceitar corrida
- [ ] 4. **Verificar**: Toast "Erro de conexão. Verifique sua internet."
- [ ] 5. **Verificar**: App NÃO crasha
- [ ] 6. Reconectar e tentar novamente
- [ ] 7. **Verificar**: Operação completa com sucesso

---

### 📊 Monitoramento e Logs

**Cenário 23: Sentry - Captura de erros**
- [ ] 1. Em ambiente de desenvolvimento, forçar um erro
- [ ] 2. **Verificar**: Console mostra log do Sentry
- [ ] 3. **Verificar**: ErrorBoundary exibe tela amigável
- [ ] 4. Clicar em "Tentar Novamente"
- [ ] 5. **Verificar**: App reinicia corretamente

**Cenário 24: Logs estruturados**
- [ ] 1. Abrir console do navegador/logcat
- [ ] 2. Fazer login
- [ ] 3. **Verificar**: Logs prefixados com `[Auth]`, `[Navigation]`, etc.
- [ ] 4. **Verificar**: Nenhum token/senha aparece nos logs

---

### 🌐 Compatibilidade

#### Android
- [ ] Testar em Android 8 (API 26)
- [ ] Testar em Android 11 (API 30)
- [ ] Testar em Android 14 (API 34)
- [ ] Testar em diferentes tamanhos de tela

#### iOS
- [ ] Testar em iOS 13
- [ ] Testar em iOS 15
- [ ] Testar em iOS 17
- [ ] Testar em iPhone SE (tela pequena)
- [ ] Testar em iPhone 15 Pro Max (tela grande)

#### Web
- [ ] Testar em Chrome
- [ ] Testar em Firefox
- [ ] Testar em Safari
- [ ] Testar em Edge

---

## 🚨 Testes de Regressão

### Funcionalidades Existentes (Não Devem Quebrar)

- [ ] Criar novo serviço (empresa)
- [ ] Aceitar corrida (motoboy)
- [ ] Atualizar status de serviço
- [ ] Chat entre empresa e motoboy
- [ ] Notificações push
- [ ] Geolocalização e mapa
- [ ] Upload de fotos
- [ ] Sistema de avaliações (se implementado)

---

## 📝 Checklist de Deploy

### Pré-Deploy
- [ ] Todas as dependências instaladas (`npm install`)
- [ ] Build passa sem erros (`npm run build`)
- [ ] Lint passa sem erros críticos (`npm run lint`)
- [ ] Testes unitários passam (quando implementados)
- [ ] Variáveis de ambiente configuradas
- [ ] Sentry DSN configurado (produção)

### Deploy Mobile
- [ ] `npm run cap:sync` executado
- [ ] Build Android passa
- [ ] Build iOS passa
- [ ] APK/AAB assinado corretamente
- [ ] Testado em dispositivos reais

### Pós-Deploy
- [ ] Verificar Sentry recebe eventos
- [ ] Monitorar logs por 24h
- [ ] Verificar taxa de crash (deve ser < 1%)
- [ ] Coletar feedback de usuários beta

---

## 🐛 Bugs Conhecidos / Limitações

1. **Campos de Rating**: Os campos `company_rating` e `motoboy_rating` ainda não existem no schema. Estatísticas de avaliação mostram 0.

2. **Sentry em Dev**: Em desenvolvimento, Sentry apenas loga no console (não envia para servidor).

3. **Criptografia Web**: A criptografia do localStorage em web é básica (base64). Para segurança real, considere usar Web Crypto API.

---

## 📞 Contato para Reportar Bugs

- **Email**: dev@motofreela.com
- **GitHub Issues**: [Link do repositório]
- **Discord**: [Link do servidor]

---

## ✅ Critérios de Aceitação

Para considerar esta release aprovada:

- [ ] **0 crashes** nos cenários críticos (1-12)
- [ ] **100%** dos cenários de autenticação passam
- [ ] **100%** dos cenários de proteção de rotas passam
- [ ] **Mensagens de erro** todas em pt-BR e amigáveis
- [ ] **Performance**: Login completa em < 3 segundos
- [ ] **Compatibilidade**: Funciona em Android 8+ e iOS 13+

---

**Última atualização**: 2025-01-24  
**Versão testada**: 1.1.0  
**Responsável**: QA Team
