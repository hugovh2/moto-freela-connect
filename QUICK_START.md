# 🚀 Quick Start - MotoFreela Mobile App

Guia rápido para começar a desenvolver o app nativo.

---

## ✅ O que foi feito

### 1. Capacitor Instalado e Configurado
- ✅ Capacitor Core, CLI, Android e iOS
- ✅ Plugins nativos instalados:
  - Geolocation (GPS)
  - Camera (Fotos)
  - Push Notifications
  - Network (Status de rede)
  - App (Estado do app)
  - Splash Screen
  - Status Bar
  - Haptics (Vibração)
  - Toast (Notificações)

### 2. Hooks Criados
Todos os hooks nativos estão em `src/hooks/`:
- `use-capacitor.ts` - Detecta plataforma (web/android/ios)
- `use-geolocation.ts` - GPS e rastreamento
- `use-camera.ts` - Câmera e galeria
- `use-push-notifications.ts` - Notificações push
- `use-network-status.ts` - Status da rede
- `use-app-state.ts` - Estado do app (ativo/background)
- `use-haptics.ts` - Feedback tátil

### 3. Utilitários Mobile
Arquivo `src/lib/mobile-utils.ts` com funções úteis:
- Conversão de fotos (base64, Blob, File)
- Cálculo de distância entre coordenadas
- Compartilhamento nativo
- Formatação de dados

### 4. Provider Configurado
`CapacitorProvider` em `src/components/CapacitorProvider.tsx` inicializa:
- Status bar
- Splash screen
- Configurações nativas

---

## 🏃 Como Rodar

### Desenvolvimento Web (Teste Rápido)
```bash
npm run dev
```
Acesse: http://localhost:8080

### Build para Produção
```bash
npm run build
```

### Adicionar Plataformas (Primeira vez)
```bash
# Android
npx cap add android

# iOS (apenas macOS)
npx cap add ios
```

### Sincronizar Código e Assets
Sempre que fizer mudanças no código:
```bash
npm run build:mobile
# Ou
npm run build && npx cap sync
```

### Abrir no Android Studio
```bash
npm run android
# Ou
npx cap open android
```

### Abrir no Xcode (macOS)
```bash
npm run ios
# Ou
npx cap open ios
```

---

## 📱 Testar em Dispositivo Real

### Android
1. Habilite "Modo Desenvolvedor" no dispositivo
2. Conecte via USB
3. No Android Studio, selecione o dispositivo
4. Clique em "Run" (▶️)

### iOS
1. Conecte iPhone/iPad via USB
2. No Xcode, selecione o dispositivo
3. Clique em "Run" (▶️)
4. Confie no certificado de desenvolvedor no dispositivo

---

## 🛠️ Exemplos de Uso dos Hooks

### GPS / Geolocalização
```typescript
import { useGeolocation } from '@/hooks/use-geolocation';

function MyComponent() {
  const { position, loading, getCurrentPosition, startWatching, stopWatching } = useGeolocation();

  // Obter posição atual
  const handleGetLocation = async () => {
    const pos = await getCurrentPosition();
    console.log(pos.coords.latitude, pos.coords.longitude);
  };

  // Rastreamento contínuo (para motoboy)
  useEffect(() => {
    startWatching();
    return () => stopWatching();
  }, []);

  return (
    <div>
      {position && (
        <p>Lat: {position.coords.latitude}, Lng: {position.coords.longitude}</p>
      )}
    </div>
  );
}
```

### Câmera
```typescript
import { useCamera } from '@/hooks/use-camera';
import { photoToFile } from '@/lib/mobile-utils';

function PhotoUpload() {
  const { takePicture, pickFromGallery } = useCamera();

  const handleTakePhoto = async () => {
    const photo = await takePicture();
    const file = await photoToFile(photo, 'entrega.jpg');
    // Upload do file para Supabase Storage
  };

  return (
    <div>
      <button onClick={handleTakePhoto}>Tirar Foto</button>
      <button onClick={pickFromGallery}>Escolher da Galeria</button>
    </div>
  );
}
```

### Notificações Push
```typescript
import { usePushNotifications } from '@/hooks/use-push-notifications';

function App() {
  const { initialize, token, notifications } = usePushNotifications();

  useEffect(() => {
    initialize(); // Inicializar ao montar o app
  }, []);

  useEffect(() => {
    if (token) {
      console.log('Push token:', token);
      // Enviar token para seu backend/Supabase
    }
  }, [token]);

  return <div>App com notificações</div>;
}
```

### Haptics (Vibração)
```typescript
import { useHaptics } from '@/hooks/use-haptics';

function Button() {
  const haptics = useHaptics();

  const handleClick = () => {
    haptics.light(); // Vibração leve
    // Executar ação
  };

  return <button onClick={handleClick}>Clique</button>;
}
```

### Detectar Plataforma
```typescript
import { useCapacitor } from '@/hooks/use-capacitor';

function MyComponent() {
  const { isNative, isAndroid, isIOS, isWeb } = useCapacitor();

  return (
    <div>
      {isNative ? (
        <p>Rodando em app nativo ({isAndroid ? 'Android' : 'iOS'})</p>
      ) : (
        <p>Rodando no navegador</p>
      )}
    </div>
  );
}
```

---

## 📦 Estrutura do Projeto

```
moto-freela-connect/
├── android/                 # Projeto Android nativo (gerado)
├── ios/                     # Projeto iOS nativo (gerado)
├── src/
│   ├── components/
│   │   └── CapacitorProvider.tsx
│   ├── hooks/              # Hooks nativos
│   │   ├── use-capacitor.ts
│   │   ├── use-geolocation.ts
│   │   ├── use-camera.ts
│   │   ├── use-push-notifications.ts
│   │   ├── use-network-status.ts
│   │   ├── use-app-state.ts
│   │   └── use-haptics.ts
│   ├── lib/
│   │   └── mobile-utils.ts
│   └── ...
├── resources/              # Ícones e splash screens
├── capacitor.config.ts     # Configuração do Capacitor
├── DEPLOYMENT.md           # Guia completo de deploy
├── PROMPT_MOTOFREELA.md    # Especificação completa
└── package.json
```

---

## 🔧 Próximos Passos

### 1. Adicionar Recursos Visuais
```bash
# Criar ícones e splash screens
# Coloque em resources/icon.png (1024x1024)
# e resources/splash.png (2732x2732)

# Gerar automaticamente
npm install -g cordova-res
cordova-res android --skip-config --copy
cordova-res ios --skip-config --copy
```

### 2. Configurar Firebase para Push Notifications

**Android:**
1. Crie projeto no [Firebase Console](https://console.firebase.google.com)
2. Adicione app Android (com.motofreela.app)
3. Baixe `google-services.json`
4. Coloque em `android/app/google-services.json`

**iOS:**
1. No Firebase, adicione app iOS
2. Baixe `GoogleService-Info.plist`
3. Coloque em `ios/App/App/GoogleService-Info.plist`

### 3. Integrar Google Maps

No `.env`:
```bash
VITE_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

Habilitar APIs no Google Cloud Console:
- Maps JavaScript API
- Geocoding API
- Directions API
- Places API

### 4. Testar Funcionalidades

Execute o checklist:
- [ ] GPS funciona e atualiza em tempo real
- [ ] Câmera abre e tira fotos
- [ ] Notificações push são recebidas
- [ ] App detecta conexão/desconexão de rede
- [ ] Haptics funcionam nos botões
- [ ] App responde corretamente a background/foreground

---

## 📚 Documentação Útil

- **Capacitor**: https://capacitorjs.com/docs
- **Android Studio**: https://developer.android.com/studio
- **Xcode**: https://developer.apple.com/xcode/
- **Firebase**: https://firebase.google.com/docs
- **Supabase**: https://supabase.com/docs

---

## 🐛 Troubleshooting

### Erro: "capacitor: command not found"
```bash
npm install -g @capacitor/cli
```

### Erro no build Android
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### Erro no build iOS
```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### Permissões não funcionam
Verifique se estão declaradas em:
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/App/App/Info.plist`

---

## ✅ Checklist de Deploy

Antes de publicar na Play Store / App Store:

- [ ] Build de produção funciona
- [ ] Ícones e splash screens adicionados
- [ ] Permissões configuradas
- [ ] Keystore criado (Android)
- [ ] Certificados configurados (iOS)
- [ ] Variáveis de ambiente configuradas
- [ ] Firebase configurado
- [ ] Google Maps funcionando
- [ ] Testes em dispositivos reais
- [ ] Screenshots preparados
- [ ] Descrição da loja preparada

Consulte `DEPLOYMENT.md` para instruções completas!

---

**🎉 Pronto! Você tem um app nativo funcional!**
