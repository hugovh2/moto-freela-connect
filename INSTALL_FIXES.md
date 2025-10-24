# 🚀 Guia de Instalação das Correções - MotoFreela v1.1.0

## 📋 Visão Geral

Este guia contém instruções passo-a-passo para aplicar todas as correções de crash e melhorias implementadas na versão 1.1.0.

---

## ⚡ Instalação Rápida

```bash
# 1. Instalar novas dependências
npm install

# 2. Sincronizar Capacitor (mobile)
npm run cap:sync

# 3. Rebuild do projeto
npm run build

# 4. Testar localmente
npm run dev
```

---

## 📦 Dependências Adicionadas

### Obrigatórias
```json
{
  "@capacitor/preferences": "^7.0.2",
  "@sentry/react": "^8.47.0",
  "@sentry/vite-plugin": "^2.22.8"
}
```

### Instalação Manual (se necessário)
```bash
npm install @capacitor/preferences@^7.0.2
npm install @sentry/react@^8.47.0
npm install @sentry/vite-plugin@^2.22.8
```

---

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Sentry (opcional, mas recomendado para produção)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_APP_VERSION=1.1.0

# Existentes (manter)
VITE_SUPABASE_PROJECT_ID=kmjcculrcpwpqlahmmnj
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
VITE_SUPABASE_URL=https://kmjcculrcpwpqlahmmnj.supabase.co
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 2. Configurar Sentry (Opcional)

Se você deseja monitoramento de crashes em produção:

1. Criar conta em [sentry.io](https://sentry.io)
2. Criar novo projeto React
3. Copiar o DSN fornecido
4. Adicionar ao `.env` como `VITE_SENTRY_DSN`

**Nota**: Sentry é opcional. Se não configurado, o app funciona normalmente mas sem monitoramento de crashes.

---

## 📱 Build Mobile

### Android

```bash
# Sincronizar código
npm run cap:sync

# Abrir no Android Studio
npm run cap:open:android

# Ou build direto
npm run android
```

### iOS

```bash
# Sincronizar código
npm run cap:sync

# Abrir no Xcode
npm run cap:open:ios

# Ou build direto
npm run ios
```

---

## 🧪 Testes

### Teste Local (Web)

```bash
# Desenvolvimento
npm run dev

# Preview de produção
npm run build
npm run preview
```

### Teste Mobile

1. **Android Emulator**:
   ```bash
   # Iniciar emulador
   emulator -avd Pixel_5_API_30
   
   # Build e instalar
   npm run android
   ```

2. **iOS Simulator**:
   ```bash
   # Build e instalar
   npm run ios
   ```

3. **Dispositivo Real**:
   - Android: Habilitar USB debugging
   - iOS: Configurar provisioning profile
   - Conectar dispositivo e executar build

---

## 🔍 Verificação de Instalação

Execute este checklist após instalação:

### ✅ Dependências
```bash
# Verificar se pacotes foram instalados
npm list @capacitor/preferences
npm list @sentry/react
```

### ✅ Build
```bash
# Build deve passar sem erros
npm run build
```

### ✅ Lint
```bash
# Lint pode ter warnings, mas não erros críticos
npm run lint
```

### ✅ Arquivos Criados

Verifique se estes arquivos existem:

```
src/lib/
├── navigation.ts          ✓
├── secure-storage.ts      ✓
├── error-handler.ts       ✓
├── supabase-client.ts     ✓
└── sentry.ts              ✓

src/components/
└── ProtectedRoute.tsx     ✓

CHANGELOG.md               ✓
QA_CHECKLIST.md           ✓
INSTALL_FIXES.md          ✓
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module '@capacitor/preferences'"

**Solução**:
```bash
npm install @capacitor/preferences@^7.0.2
npm run cap:sync
```

### Erro: "Cannot find module '@sentry/react'"

**Solução**:
```bash
npm install @sentry/react@^8.47.0
```

### Erro: TypeScript - "Property 'X' does not exist"

**Solução**: Isso é esperado se você não executou `npm install`. Execute:
```bash
npm install
```

### Build mobile falha

**Solução**:
```bash
# Limpar cache
rm -rf node_modules
rm -rf android/.gradle
rm -rf ios/App/Pods

# Reinstalar
npm install
npm run cap:sync
```

### App ainda crasha após instalação

**Verificar**:
1. Você fez logout e login novamente? (Tokens antigos precisam ser migrados)
2. Limpou cache do app?
3. Reinstalou o app completamente?

**Limpar dados do app**:
- Android: Settings > Apps > MotoFreela > Storage > Clear Data
- iOS: Desinstalar e reinstalar

---

## 🔄 Migração de Dados

### Tokens de Autenticação

**Importante**: Após a atualização, os usuários precisarão fazer login novamente.

**Por quê?**: Os tokens agora são armazenados de forma segura (Capacitor Preferences no mobile, localStorage criptografado na web). Tokens antigos em localStorage não-criptografado não serão migrados automaticamente.

**Comunicação aos usuários**:
```
"Melhoramos a segurança do app! Por favor, faça login novamente."
```

### Dados de Serviços

**Nenhuma migração necessária** - Todos os dados de serviços, perfis e mensagens permanecem intactos no Supabase.

---

## 📊 Monitoramento Pós-Deploy

### Métricas a Acompanhar

1. **Taxa de Crash**: Deve ser < 1%
   - Verificar no Sentry (se configurado)
   - Ou via Firebase Crashlytics

2. **Tempo de Login**: Deve ser < 3 segundos
   - Monitorar via Sentry Performance

3. **Erros de Autenticação**: Devem diminuir drasticamente
   - Verificar logs do Supabase

4. **Feedback de Usuários**: Coletar via:
   - Reviews na Play Store / App Store
   - Suporte ao cliente
   - Analytics de eventos

### Logs Importantes

Monitore estes logs no console:

```
✅ Bom:
[Navigation] Successfully navigated to: /company
[Supabase] Auth state changed: SIGNED_IN
[Sentry] Initialized successfully

❌ Ruim:
[Navigation] Navigator function is not available
[Supabase] Token refresh error
[ErrorHandler] Exception (dev mode)
```

---

## 🚀 Deploy para Produção

### Checklist Pré-Deploy

- [ ] Todas as dependências instaladas
- [ ] Build passa sem erros
- [ ] Testes críticos passam (ver QA_CHECKLIST.md)
- [ ] Sentry configurado (produção)
- [ ] Variáveis de ambiente configuradas
- [ ] Versão atualizada no package.json

### Deploy Web (Vercel/Netlify)

```bash
# Build de produção
npm run build

# Deploy (exemplo Vercel)
vercel --prod
```

### Deploy Mobile

**Android (Google Play)**:
```bash
# Build release
cd android
./gradlew bundleRelease

# Upload para Play Console
# Arquivo: android/app/build/outputs/bundle/release/app-release.aab
```

**iOS (App Store)**:
```bash
# Build release no Xcode
# Product > Archive
# Distribute App > App Store Connect
```

---

## 📞 Suporte

### Problemas na Instalação?

1. **Verificar logs**: `npm run dev` e observar console
2. **Verificar issues**: [GitHub Issues]
3. **Contatar suporte**: dev@motofreela.com

### Reportar Bugs

Ao reportar bugs, inclua:
- Versão do app (1.1.0)
- Sistema operacional e versão
- Passos para reproduzir
- Logs do console (se possível)
- Screenshots/vídeo

---

## ✅ Próximos Passos

Após instalação bem-sucedida:

1. **Executar QA completo**: Seguir `QA_CHECKLIST.md`
2. **Testar em dispositivos reais**: Android e iOS
3. **Beta testing**: Liberar para grupo pequeno de usuários
4. **Monitorar métricas**: Por 48h antes de release completo
5. **Release gradual**: 10% → 50% → 100% dos usuários

---

**Última atualização**: 2025-01-24  
**Versão**: 1.1.0  
**Autor**: Windsurf AI Assistant
