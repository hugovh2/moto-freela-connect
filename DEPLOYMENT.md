# 🚀 Guia de Deployment - MotoFreela

Guia completo para publicar o app MotoFreela na **Google Play Store** e **Apple App Store**.

---

## 📋 Pré-requisitos

### Desenvolvimento Android
- ✅ Android Studio instalado ([Download](https://developer.android.com/studio))
- ✅ Java JDK 17+ instalado
- ✅ Variáveis de ambiente configuradas (ANDROID_HOME, JAVA_HOME)
- ✅ Conta de desenvolvedor Google Play ($25 taxa única)

### Desenvolvimento iOS
- ✅ macOS com Xcode 14+ instalado
- ✅ Conta Apple Developer ($99/ano)
- ✅ Certificados e provisioning profiles configurados
- ✅ CocoaPods instalado (`sudo gem install cocoapods`)

---

## 🏗️ Build do Projeto

### 1. Preparar o Ambiente

```bash
# Instalar dependências
npm install

# Build da aplicação web
npm run build

# Verificar se o build foi bem-sucedido
# Deve criar a pasta 'dist' com os arquivos compilados
```

### 2. Adicionar Plataformas

```bash
# Adicionar plataforma Android
npx cap add android

# Adicionar plataforma iOS (apenas no macOS)
npx cap add ios

# Sincronizar código e assets
npx cap sync
```

---

## 🤖 Deploy Android (Google Play)

### Passo 1: Configurar o Projeto Android

```bash
# Abrir no Android Studio
npm run cap:open:android
```

### Passo 2: Configurar Assinatura do App

Crie um keystore para assinar o app:

```bash
keytool -genkey -v -keystore motofreela-release.keystore -alias motofreela -keyalg RSA -keysize 2048 -validity 10000
```

**⚠️ IMPORTANTE**: Guarde o keystore e as senhas em local seguro! Você precisará delas para todas as atualizações futuras.

### Passo 3: Configurar build.gradle

Edite `android/app/build.gradle` e adicione:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            storeFile file("../../motofreela-release.keystore")
            storePassword "SUA_SENHA_KEYSTORE"
            keyAlias "motofreela"
            keyPassword "SUA_SENHA_KEY"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Passo 4: Atualizar AndroidManifest.xml

Edite `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permissões necessárias -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:label="MotoFreela"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config">
        ...
    </application>
</manifest>
```

### Passo 5: Gerar APK/AAB de Release

```bash
cd android

# Gerar AAB (recomendado para Play Store)
./gradlew bundleRelease

# Ou gerar APK (para testes)
./gradlew assembleRelease

cd ..
```

O arquivo será gerado em:
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`

### Passo 6: Upload para Google Play Console

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo aplicativo
3. Preencha as informações:
   - **Nome**: MotoFreela
   - **Descrição curta**: Conectando empresas e motoboys para entregas rápidas
   - **Descrição completa**: [Use o texto do PROMPT_MOTOFREELA.md]
   - **Categoria**: Negócios / Produtividade
   - **Classificação**: Livre
4. Adicione screenshots (mínimo 2 por tipo de dispositivo)
5. Configure preço (Grátis)
6. Faça upload do AAB em "Produção" ou "Teste interno"
7. Preencha questionário de conteúdo
8. Enviar para revisão

**Tempo de análise**: 1-3 dias úteis

---

## 🍎 Deploy iOS (App Store)

### Passo 1: Abrir no Xcode

```bash
npm run cap:open:ios
```

### Passo 2: Configurar Projeto no Xcode

1. Selecione o projeto "App" no navegador
2. Na aba "General":
   - **Display Name**: MotoFreela
   - **Bundle Identifier**: com.motofreela.app
   - **Version**: 1.0.0
   - **Build**: 1
   - **Team**: Selecione seu time de desenvolvedor

### Passo 3: Configurar Capacidades (Capabilities)

Na aba "Signing & Capabilities", adicione:
- ✅ **Push Notifications**
- ✅ **Background Modes**: Location updates, Remote notifications
- ✅ **Location Services**

### Passo 4: Configurar Info.plist

Edite `ios/App/App/Info.plist` e adicione as permissões:

```xml
<dict>
    <!-- Permissão de Localização -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>O MotoFreela precisa da sua localização para mostrar serviços próximos</string>
    
    <key>NSLocationAlwaysUsageDescription</key>
    <string>O MotoFreela precisa rastrear sua localização para atualizações em tempo real das entregas</string>
    
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Permitir rastreamento contínuo para melhor experiência de entrega</string>
    
    <!-- Permissão de Câmera -->
    <key>NSCameraUsageDescription</key>
    <string>O MotoFreela precisa acessar a câmera para tirar fotos das entregas</string>
    
    <!-- Permissão de Fotos -->
    <key>NSPhotoLibraryUsageDescription</key>
    <string>O MotoFreela precisa acessar suas fotos para anexar comprovantes</string>
    
    <key>NSPhotoLibraryAddUsageDescription</key>
    <string>O MotoFreela precisa salvar fotos das entregas</string>
</dict>
```

### Passo 5: Configurar Push Notifications

1. Acesse [Apple Developer Console](https://developer.apple.com)
2. Vá em "Certificates, Identifiers & Profiles"
3. Crie um **App ID** com Push Notifications habilitado
4. Crie um **APNs Key** para notificações
5. Configure no Firebase ou seu backend

### Passo 6: Gerar Build de Release

1. No Xcode, selecione esquema "Any iOS Device (arm64)"
2. Menu: **Product > Archive**
3. Aguarde o build finalizar
4. Janela "Organizer" abrirá automaticamente

### Passo 7: Upload para App Store Connect

1. Na janela Organizer, clique em "Distribute App"
2. Selecione "App Store Connect"
3. Clique em "Upload"
4. Aguarde o processamento (pode levar alguns minutos)

### Passo 8: Configurar na App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie um novo app
3. Preencha as informações:
   - **Nome**: MotoFreela
   - **Idioma principal**: Português (Brasil)
   - **Bundle ID**: com.motofreela.app
   - **SKU**: MOTOFREELA001
4. Na seção "Prepare for Submission":
   - Adicione screenshots (iPhone 6.7", 6.5", 5.5")
   - Adicione screenshots iPad Pro (12.9", 11")
   - Descrição do app
   - Palavras-chave
   - URL de suporte
   - URL de privacidade
5. Selecione o build que foi enviado
6. Preencha questionários de privacidade e exportação
7. Enviar para revisão

**Tempo de análise**: 1-2 dias úteis

---

## 🔄 Atualizações Futuras

### Android

```bash
# 1. Atualizar código
npm run build

# 2. Sincronizar
npx cap sync android

# 3. Incrementar versionCode e versionName em android/app/build.gradle
# versionCode: número inteiro (2, 3, 4...)
# versionName: string ("1.0.1", "1.1.0"...)

# 4. Gerar novo AAB
cd android && ./gradlew bundleRelease && cd ..

# 5. Upload na Play Console como "Atualização"
```

### iOS

```bash
# 1. Atualizar código
npm run build

# 2. Sincronizar
npx cap sync ios

# 3. Abrir no Xcode
npm run cap:open:ios

# 4. Incrementar Version e Build number
# Version: "1.0.1", "1.1.0"...
# Build: 2, 3, 4...

# 5. Archive e Upload novamente
```

---

## 🧪 Testes Antes do Deploy

### Checklist de Testes

- [ ] Login e cadastro funcionando
- [ ] Criar serviço (empresa)
- [ ] Aceitar serviço (motoboy)
- [ ] GPS e localização em tempo real
- [ ] Câmera e upload de fotos
- [ ] Notificações push recebidas
- [ ] Chat em tempo real
- [ ] Sistema de avaliações
- [ ] App funciona offline (parcialmente)
- [ ] Performance em dispositivos low-end

### Teste em Dispositivos Reais

**Android:**
```bash
# Conectar dispositivo via USB
# Habilitar modo desenvolvedor no dispositivo
adb devices

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

**iOS:**
No Xcode, selecione seu dispositivo conectado e clique em "Run" (▶️)

---

## 📊 Monitoramento Pós-Deploy

### Google Play Console
- Crashlytics (crashes)
- Android Vitals (performance)
- Avaliações e comentários
- Estatísticas de instalação

### App Store Connect
- Crash reports
- Energy usage
- Avaliações e comentários
- Analytics

### Firebase (Recomendado)
```bash
# Instalar Firebase
npm install firebase

# Configurar Crashlytics e Analytics
```

---

## 🔐 Segurança

### Variáveis de Ambiente

Nunca commite chaves sensíveis! Use:

```bash
# .env (não commitar)
VITE_SUPABASE_URL=sua_url
VITE_SUPABASE_ANON_KEY=sua_key
VITE_GOOGLE_MAPS_API_KEY=sua_key
```

### Ofuscação de Código

**Android**: ProGuard já configurado no build.gradle

**iOS**: Symbols stripped automaticamente em release builds

---

## 📱 Store Listings

### Texto Sugerido

**Título**: MotoFreela - Entregas Rápidas

**Subtítulo (iOS)**: Conecte-se com motoboys verificados

**Descrição Curta**:
Plataforma que conecta empresas com motoboys autônomos para entregas rápidas, seguras e eficientes.

**Descrição Completa**:
[Use a descrição completa do PROMPT_MOTOFREELA.md, adaptada para stores]

**Palavras-chave** (iOS):
entregas, motoboy, delivery, logística, serviços, transporte, rápido, confiável

**Categoria**:
- Google Play: Negócios / Produtividade
- App Store: Business / Productivity

---

## 🆘 Troubleshooting

### Erro de Build Android

```bash
# Limpar cache
cd android
./gradlew clean
cd ..

# Sincronizar novamente
npx cap sync android
```

### Erro de Build iOS

```bash
# Limpar build
cd ios/App
xcodebuild clean
pod install
cd ../..

# Sincronizar novamente
npx cap sync ios
```

### App não abre após install

- Verificar AndroidManifest.xml / Info.plist
- Verificar permissões necessárias
- Checar logs: `adb logcat` (Android) ou Xcode Console (iOS)

---

## 📞 Suporte

Para dúvidas sobre deployment:
- 📧 Email: dev@motofreela.com
- 📖 Docs Capacitor: https://capacitorjs.com/docs
- 📖 Docs Android: https://developer.android.com
- 📖 Docs iOS: https://developer.apple.com

---

**✅ Boa sorte com o deploy! 🚀**
