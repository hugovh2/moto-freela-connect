# 🧪 Guia Completo de Teste - MotoFreela

Guia passo a passo para testar seu aplicativo nativo.

---

## 🎯 Pré-requisitos

### Para Android
- ✅ Android Studio instalado
- ✅ Java JDK 17+ instalado
- ✅ Variável ANDROID_HOME configurada

### Para iOS (apenas macOS)
- ✅ Xcode 14+ instalado
- ✅ CocoaPods instalado
- ✅ Conta Apple Developer (para dispositivo real)

---

## 🚀 Passo 1: Build da Aplicação

```bash
# Na pasta do projeto
npm run build
```

Este comando cria a pasta `dist/` com os arquivos compilados.

---

## 🤖 Passo 2A: Testar no Android

### Primeira Vez - Adicionar Plataforma

```bash
npx cap add android
```

Isso cria a pasta `android/` com o projeto nativo.

### Sincronizar Código

Sempre que fizer mudanças no código React:

```bash
npm run build
npx cap sync android
```

Ou use o atalho:
```bash
npm run build:mobile
```

### Abrir no Android Studio

```bash
npx cap open android
```

Ou use o atalho completo (build + sync + open):
```bash
npm run android
```

### No Android Studio

**Primeira vez:**
1. Aguarde o Gradle sync finalizar (pode demorar 5-10 minutos)
2. Se houver erros, clique em "Sync Project with Gradle Files"

**Criar/Selecionar Emulador:**
1. Clique no dropdown de dispositivos no topo
2. Se não tiver emulador: **Device Manager** → **Create Device**
3. Escolha um modelo (ex: Pixel 6)
4. Escolha uma imagem do sistema (ex: Android 13 - API 33)
5. Clique em **Finish**

**Executar:**
1. Selecione o emulador ou dispositivo
2. Clique no botão **Run** (▶️ verde)
3. Aguarde o app instalar e abrir

---

## 🍎 Passo 2B: Testar no iOS (macOS apenas)

### Primeira Vez - Adicionar Plataforma

```bash
npx cap add ios
cd ios/App
pod install
cd ../..
```

### Sincronizar Código

```bash
npm run build
npx cap sync ios
```

Ou use o atalho:
```bash
npm run build:mobile
```

### Abrir no Xcode

```bash
npx cap open ios
```

Ou use o atalho completo:
```bash
npm run ios
```

### No Xcode

**Selecionar Simulador:**
1. No topo, ao lado do botão Run, clique no dropdown
2. Selecione um simulador (ex: iPhone 14)

**Executar:**
1. Clique no botão **Run** (▶️)
2. Aguarde o build e instalação
3. O simulador abrirá automaticamente

---

## 📱 Passo 3: Testar em Dispositivo Real

### Android Real

**1. Habilitar Modo Desenvolvedor no dispositivo:**
- Vá em **Configurações** → **Sobre o telefone**
- Toque 7 vezes em **Número da versão** ou **Versão do MIUI/One UI**
- Volte e entre em **Opções do desenvolvedor**
- Ative **Depuração USB**

**2. Conectar via USB:**
- Conecte o cabo USB
- Autorize o computador no dispositivo (popup)

**3. Verificar conexão:**
```bash
# Listar dispositivos conectados
adb devices
```

Deve aparecer algo como:
```
List of devices attached
ABC123XYZ    device
```

**4. Executar no Android Studio:**
- Selecione seu dispositivo no dropdown (vai aparecer o nome/modelo)
- Clique em **Run** (▶️)
- O app será instalado no seu celular

### iOS Real (requer conta Apple Developer)

**1. Conectar iPhone/iPad via USB**

**2. No Xcode:**
- Selecione o projeto "App"
- Na aba **Signing & Capabilities**
- Em **Team**, selecione sua conta Apple Developer
- Se não tiver, clique em "Add Account"

**3. Confiar no certificado no dispositivo:**
- No iPhone: **Ajustes** → **Geral** → **Gerenciamento de Dispositivo**
- Confie no seu certificado de desenvolvedor

**4. Executar:**
- Selecione seu dispositivo no Xcode
- Clique em **Run** (▶️)

---

## 🧪 Passo 4: Testar Funcionalidades Nativas

### Usar Componente de Demonstração

**1. Crie uma rota de teste no `src/App.tsx`:**

```typescript
import { NativeFeaturesDemo } from '@/components/NativeFeaturesDemo';

// Adicione esta rota:
<Route path="/test-native" element={<NativeFeaturesDemo />} />
```

**2. Acesse no app:**
- Navegue para `/test-native` ou adicione um botão na home

### Ou Teste Manualmente

**GPS:**
```typescript
import { useGeolocation } from '@/hooks/use-geolocation';

function TestGPS() {
  const { position, getCurrentPosition } = useGeolocation();

  return (
    <button onClick={() => getCurrentPosition()}>
      Obter Localização
    </button>
  );
}
```

**Câmera:**
```typescript
import { useCamera } from '@/hooks/use-camera';

function TestCamera() {
  const { photo, takePicture } = useCamera();

  return (
    <div>
      <button onClick={() => takePicture()}>Tirar Foto</button>
      {photo && <img src={photo.webPath} />}
    </div>
  );
}
```

**Vibração:**
```typescript
import { useHaptics } from '@/hooks/use-haptics';

function TestHaptics() {
  const haptics = useHaptics();

  return (
    <button onClick={() => haptics.medium()}>
      Vibrar
    </button>
  );
}
```

---

## ✅ Checklist de Testes

### Interface
- [ ] App abre sem erros
- [ ] Navegação entre telas funciona
- [ ] Botões respondem ao toque
- [ ] Formulários funcionam
- [ ] Imagens carregam corretamente

### Funcionalidades Nativas
- [ ] **GPS**: Solicita permissão e obtém localização
- [ ] **Câmera**: Abre e tira fotos
- [ ] **Galeria**: Abre e seleciona fotos
- [ ] **Vibração**: Vibra ao tocar botões
- [ ] **Splash Screen**: Aparece ao abrir app
- [ ] **Status Bar**: Cores corretas

### Integração (se configurado)
- [ ] Login/cadastro funciona
- [ ] Dados salvam no Supabase
- [ ] Fotos fazem upload
- [ ] Mapas carregam (se Google Maps configurado)

### Performance
- [ ] App abre em menos de 3 segundos
- [ ] Transições são suaves
- [ ] Sem travamentos
- [ ] Scroll fluído

---

## 🐛 Problemas Comuns

### "capacitor: command not found"
```bash
npm install -g @capacitor/cli
```

### Android: Gradle sync falha
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### iOS: Pod install falha
```bash
cd ios/App
pod repo update
pod install
cd ../..
```

### App não instala no dispositivo
- **Android**: Verifique se USB debugging está ativo
- **iOS**: Verifique se confiou no certificado no dispositivo

### GPS não funciona
- Verifique se deu permissão de localização
- Em emuladores, você pode simular localização:
  - **Android**: Three dots → Location
  - **iOS**: Features → Location → Custom Location

### Câmera não abre
- Emuladores podem não ter câmera
- Teste em dispositivo real

---

## 📊 Logs e Debug

### Android

**Ver logs em tempo real:**
```bash
adb logcat
```

**Filtrar por tag:**
```bash
adb logcat -s "Capacitor"
```

**Limpar logs:**
```bash
adb logcat -c
```

### iOS

No Xcode:
- **View** → **Debug Area** → **Show Debug Area**
- Os logs aparecem na parte inferior

---

## 🔄 Fluxo de Desenvolvimento

### Fazer mudanças no código

```bash
# 1. Edite seus arquivos React
# 2. Build
npm run build

# 3. Sincronize (copia build para apps nativos)
npx cap sync

# 4. Se o app já está aberto, recarregue
# Android: Ctrl+M (menu) → Reload
# iOS: Cmd+R
```

### Atalho completo

```bash
# Build + Sync + Abrir Android Studio
npm run android

# Build + Sync + Abrir Xcode
npm run ios
```

---

## 🎨 Personalizações Opcionais

### Mudar Ícone do App (temporário para teste)

Coloque um ícone PNG em `public/icon.png` e edite `index.html`:

```html
<link rel="icon" type="image/png" href="/icon.png" />
```

### Mudar Nome do App

Edite `capacitor.config.ts`:
```typescript
appName: 'MeuApp',
```

Depois sincronize:
```bash
npx cap sync
```

### Mudar Cor do Splash Screen

Edite `capacitor.config.ts`:
```typescript
SplashScreen: {
  backgroundColor: '#YOUR_COLOR',
}
```

---

## 📹 Live Reload (Desenvolvimento Avançado)

Para ver mudanças em tempo real sem rebuildar:

**1. Encontre o IP do seu computador:**
```bash
# Windows
ipconfig

# macOS/Linux  
ifconfig
```

**2. Edite `capacitor.config.ts`:**
```typescript
const config: CapacitorConfig = {
  // ... resto da config
  server: {
    url: 'http://SEU_IP:8080', // ex: http://192.168.1.100:8080
    cleartext: true,
  },
};
```

**3. Execute o dev server:**
```bash
npm run dev
```

**4. Sincronize e abra o app:**
```bash
npx cap sync
npm run android  # ou ios
```

Agora mudanças no código recarregam automaticamente no app!

**⚠️ IMPORTANTE**: Remova `server` do config antes de fazer build de produção!

---

## 🎯 Próximo Passo: Deploy

Quando tudo estiver funcionando, consulte:
- **`DEPLOYMENT.md`** - Para publicar nas lojas
- **`CHECKLIST_MOBILE.md`** - Checklist antes do deploy

---

## 📞 Ajuda

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Android Studio**: https://developer.android.com/studio/run
- **Xcode**: https://developer.apple.com/documentation/xcode

---

**🎉 Bom teste! Qualquer dúvida, consulte este guia ou a documentação!**
