# Recursos para App Stores

Esta pasta contém os recursos visuais necessários para publicar o app na App Store e Google Play.

## 📱 Ícones Necessários

### Android (Google Play)
Coloque os ícones na pasta `android/app/src/main/res/`:
- **mipmap-mdpi**: 48x48px
- **mipmap-hdpi**: 72x72px
- **mipmap-xhdpi**: 96x96px
- **mipmap-xxhdpi**: 144x144px
- **mipmap-xxxhdpi**: 192x192px

### iOS (App Store)
O Xcode gerará automaticamente, mas você precisa de:
- **Icon.png**: 1024x1024px (ícone da App Store)

## 🎨 Splash Screens

### Android
- **splash.png**: 2732x2732px (centralizado em fundo #FF6B35)

### iOS
- **Splash.png**: 2732x2732px (centralizado)

## 🛠️ Gerando Recursos Automaticamente

Você pode usar ferramentas como:

### Cordova Res (Recomendado)
```bash
npm install -g cordova-res
cordova-res android --skip-config --copy
cordova-res ios --skip-config --copy
```

### Capacitor Assets (Alternativa)
```bash
npm install @capacitor/assets -D
npx capacitor-assets generate --android --ios
```

## 📋 Checklist de Recursos

### Para Android
- [ ] Ícone do app (todas as densidades)
- [ ] Splash screen
- [ ] Banner promocional: 1024x500px
- [ ] Screenshots: mínimo 2, tamanhos variados
- [ ] Ícone de feature graphic: 1024x500px

### Para iOS
- [ ] Ícone do app (1024x1024px)
- [ ] Splash screen
- [ ] Screenshots: iPhone e iPad
- [ ] Preview video (opcional)

## 🎯 Especificações de Design

### Ícone do App
- **Formato**: PNG com transparência
- **Cores**: Laranja (#FF6B35) como principal
- **Design**: Logo do motoboy estilizado
- **Texto**: Evitar texto muito pequeno

### Splash Screen
- **Fundo**: Gradiente laranja (#FF6B35)
- **Logo**: Centralizado, 40% da largura da tela
- **Texto**: "MotoFreela" abaixo do logo

## 📸 Screenshots Sugeridos

1. **Tela inicial** - Mapa com serviços disponíveis
2. **Lista de serviços** - Cards de entregas
3. **Criar serviço** - Formulário intuitivo
4. **Chat** - Comunicação em tempo real
5. **Perfil** - Avaliações e estatísticas
