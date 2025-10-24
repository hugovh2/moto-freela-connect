# 🏍️ MotoFreela - App Nativo

Aplicativo nativo para Android e iOS construído com React + Capacitor.

---

## 📱 Sobre o Projeto

MotoFreela é uma plataforma que conecta motoboys autônomos com empresas que precisam de entregas rápidas e serviços logísticos. Este projeto foi convertido em um app nativo completo, pronto para ser publicado na **Google Play Store** e **Apple App Store**.

### ✨ Funcionalidades Nativas

- ✅ **GPS / Geolocalização** - Rastreamento em tempo real
- ✅ **Câmera** - Tirar fotos de entregas e documentos
- ✅ **Galeria de Fotos** - Selecionar imagens existentes
- ✅ **Notificações Push** - Receber alertas em tempo real
- ✅ **Status de Rede** - Detectar conexão/desconexão
- ✅ **Haptics (Vibração)** - Feedback tátil
- ✅ **Splash Screen** - Tela de inicialização customizada
- ✅ **Status Bar** - Controle de cores e estilo
- ✅ **Estado do App** - Detectar background/foreground

---

## 🚀 Como Começar

### Pré-requisitos

**Para Desenvolvimento Web:**
- Node.js 18+ instalado
- npm ou bun

**Para Android:**
- Android Studio instalado
- Java JDK 17+
- Android SDK configurado

**Para iOS (macOS apenas):**
- Xcode 14+
- CocoaPods
- Conta Apple Developer

### Instalação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd moto-freela-connect

# Instale as dependências
npm install

# Execute em modo desenvolvimento (web)
npm run dev
```

### Primeiro Build Mobile

```bash
# Build da aplicação web
npm run build

# Adicionar plataformas (primeira vez apenas)
npx cap add android
npx cap add ios

# Sincronizar código
npx cap sync

# Abrir no Android Studio
npm run android

# Abrir no Xcode (macOS)
npm run ios
```

---

## 📦 Scripts Disponíveis

### Desenvolvimento
```bash
npm run dev              # Servidor de desenvolvimento (web)
npm run build            # Build de produção
npm run preview          # Preview do build
```

### Mobile
```bash
npm run build:mobile     # Build + sincronizar com apps nativos
npm run android          # Build + abrir Android Studio
npm run ios              # Build + abrir Xcode
npm run cap:sync         # Sincronizar código sem rebuild
npm run cap:open:android # Apenas abrir Android Studio
npm run cap:open:ios     # Apenas abrir Xcode
```

### Recursos
```bash
npm run resources:check  # Verificar ícones e splash screens
```

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** - Framework UI
- **TypeScript** - Linguagem tipada
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI
- **React Router** - Navegação
- **React Query** - Gerenciamento de estado

### Backend
- **Supabase** - Auth, Database, Storage, Realtime
- **PostgreSQL** - Banco de dados

### Mobile
- **Capacitor 7** - Framework nativo
- **@capacitor/geolocation** - GPS
- **@capacitor/camera** - Câmera
- **@capacitor/push-notifications** - Notificações
- **@capacitor/network** - Status de rede
- **@capacitor/app** - Lifecycle do app
- **@capacitor/splash-screen** - Tela inicial
- **@capacitor/status-bar** - Barra de status
- **@capacitor/haptics** - Feedback tátil

---

## 📂 Estrutura do Projeto

```
moto-freela-connect/
├── android/                    # Projeto Android (gerado)
├── ios/                        # Projeto iOS (gerado)
├── resources/                  # Ícones e splash screens
│   ├── icon.png               # Ícone 1024x1024
│   ├── splash.png             # Splash 2732x2732
│   └── README.md              # Especificações
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── CapacitorProvider.tsx  # Provider nativo
│   │   └── NativeFeaturesDemo.tsx # Demo funcionalidades
│   ├── hooks/
│   │   ├── use-capacitor.ts       # Detecta plataforma
│   │   ├── use-geolocation.ts     # GPS
│   │   ├── use-camera.ts          # Câmera
│   │   ├── use-push-notifications.ts # Push
│   │   ├── use-network-status.ts  # Rede
│   │   ├── use-app-state.ts       # Estado do app
│   │   └── use-haptics.ts         # Vibração
│   ├── lib/
│   │   └── mobile-utils.ts        # Utilitários mobile
│   ├── pages/                     # Páginas da aplicação
│   └── integrations/              # Integrações (Supabase)
├── capacitor.config.ts        # Configuração Capacitor
├── vite.config.ts             # Configuração Vite
├── DEPLOYMENT.md              # Guia completo de deploy
├── QUICK_START.md             # Guia rápido
├── PROMPT_MOTOFREELA.md       # Especificação do projeto
└── package.json
```

---

## 🎨 Design e UX

### Paleta de Cores
- **Primary**: `#FF6B35` (Laranja vibrante)
- **Secondary**: `#004E89` (Azul escuro)
- **Accent**: `#00D9FF` (Azul claro)
- **Success**: `#10B981` (Verde)
- **Warning**: `#F59E0B` (Amarelo)
- **Error**: `#EF4444` (Vermelho)

### Princípios
1. Simplicidade - Máximo 3 cliques para ações principais
2. Feedback imediato - Confirmações visuais e táteis
3. Responsividade - Funciona em qualquer dispositivo
4. Acessibilidade - Contraste adequado, navegação simples
5. Performance - Carregamento rápido, experiência fluida

---

## 🔒 Segurança e Privacidade

### Permissões Solicitadas

**Android (AndroidManifest.xml):**
- `ACCESS_FINE_LOCATION` - GPS preciso
- `ACCESS_COARSE_LOCATION` - GPS aproximado
- `CAMERA` - Tirar fotos
- `READ_EXTERNAL_STORAGE` - Ler galeria
- `WRITE_EXTERNAL_STORAGE` - Salvar fotos
- `INTERNET` - Conexão com servidor
- `ACCESS_NETWORK_STATE` - Status da rede
- `VIBRATE` - Feedback tátil

**iOS (Info.plist):**
- `NSLocationWhenInUseUsageDescription` - GPS em uso
- `NSLocationAlwaysUsageDescription` - GPS em background
- `NSCameraUsageDescription` - Câmera
- `NSPhotoLibraryUsageDescription` - Galeria

### Boas Práticas
- ✅ Permissões solicitadas apenas quando necessárias
- ✅ Dados sensíveis nunca em log
- ✅ Comunicação HTTPS obrigatória
- ✅ Tokens armazenados de forma segura
- ✅ Validação de dados no cliente e servidor

---

## 🧪 Testando o App

### Teste em Desenvolvimento Web
```bash
npm run dev
# Acesse http://localhost:8080
```

### Teste em Android
1. Conecte um dispositivo Android via USB ou use emulador
2. Habilite "Modo Desenvolvedor" no dispositivo
3. Execute: `npm run android`
4. No Android Studio, clique em Run (▶️)

### Teste em iOS
1. Conecte um iPhone/iPad via USB
2. No Xcode, selecione o dispositivo
3. Execute: `npm run ios`
4. Clique em Run (▶️)

### Componente de Teste
Use `<NativeFeaturesDemo />` para testar todas as funcionalidades nativas:

```typescript
import { NativeFeaturesDemo } from '@/components/NativeFeaturesDemo';

function TestPage() {
  return <NativeFeaturesDemo />;
}
```

---

## 📦 Build de Produção

### Android (AAB/APK)
```bash
# 1. Build da aplicação
npm run build

# 2. Sincronizar
npx cap sync android

# 3. Abrir no Android Studio
npx cap open android

# 4. No Android Studio:
#    Build > Generate Signed Bundle / APK
#    Selecione "Android App Bundle" (AAB)
#    Siga o assistente de assinatura
```

### iOS (IPA)
```bash
# 1. Build da aplicação
npm run build

# 2. Sincronizar
npx cap sync ios

# 3. Abrir no Xcode
npx cap open ios

# 4. No Xcode:
#    Product > Archive
#    Aguarde o build finalizar
#    Window > Organizer
#    Distribute App > App Store Connect
```

**Consulte `DEPLOYMENT.md` para instruções completas!**

---

## 📱 Publicação nas Stores

### Google Play Store
1. Crie uma conta de desenvolvedor ($25 única vez)
2. Acesse [Google Play Console](https://play.google.com/console)
3. Crie um novo aplicativo
4. Preencha store listing (descrição, screenshots, ícone)
5. Faça upload do AAB
6. Configure preço e disponibilidade
7. Envie para revisão (1-3 dias)

### Apple App Store
1. Crie conta Apple Developer ($99/ano)
2. Acesse [App Store Connect](https://appstoreconnect.apple.com)
3. Crie um novo app
4. Preencha informações e screenshots
5. Upload do build via Xcode
6. Envie para revisão (1-2 dias)

---

## 🔄 Atualizações

### Versioning
Siga o padrão [Semantic Versioning](https://semver.org/):
- **MAJOR.MINOR.PATCH** (ex: 1.0.0, 1.1.0, 1.1.1)

### Android
Atualize em `android/app/build.gradle`:
```gradle
versionCode 2        // Inteiro incremental
versionName "1.0.1"  // String para usuário
```

### iOS
Atualize no Xcode:
- **Version**: 1.0.1
- **Build**: 2

```bash
# Após atualizar versões
npm run build:mobile
# Gere novo AAB/IPA e faça upload
```

---

## 📚 Documentação Adicional

- **[QUICK_START.md](./QUICK_START.md)** - Guia rápido para começar
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guia completo de deploy
- **[PROMPT_MOTOFREELA.md](./PROMPT_MOTOFREELA.md)** - Especificação completa do projeto
- **[resources/README.md](./resources/README.md)** - Especificações de recursos visuais

### Links Úteis
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Developer](https://developer.android.com)
- [Apple Developer](https://developer.apple.com)
- [Supabase Docs](https://supabase.com/docs)
- [React Docs](https://react.dev)

---

## 🐛 Troubleshooting

### App não abre no dispositivo
- Verifique permissões no AndroidManifest.xml / Info.plist
- Limpe e rebuilde: `cd android && ./gradlew clean && cd ..`
- Sincronize novamente: `npx cap sync`

### GPS não funciona
- Verifique se permissões foram concedidas
- No Android: Settings > Apps > MotoFreela > Permissions
- No iOS: Settings > Privacy > Location Services

### Câmera não abre
- Verifique permissões de câmera
- Em iOS, certifique-se que `NSCameraUsageDescription` está no Info.plist

### Build falha
- Limpe caches: `npm run build` novamente
- No Android: `cd android && ./gradlew clean`
- No iOS: Product > Clean Build Folder

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 📞 Suporte

- 📧 Email: suporte@motofreela.com
- 💬 Discord: [Link do servidor]
- 📱 WhatsApp: (XX) XXXXX-XXXX
- 🐛 Issues: [GitHub Issues](https://github.com/seu-repo/issues)

---

## 🎉 Agradecimentos

- **Capacitor** - Por tornar apps nativos acessíveis
- **Supabase** - Backend completo e simples
- **shadcn/ui** - Componentes UI lindos
- **Comunidade React** - Por todo o suporte

---

**Desenvolvido com ❤️ para facilitar entregas urbanas**

🏍️ **MotoFreela - Conectando Empresas e Motoboys**
