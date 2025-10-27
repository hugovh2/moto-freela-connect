# 🚀 Quick Start - Android

## ⚡ Configuração Rápida (5 minutos)

### 1. **Variáveis de Ambiente**

Crie o arquivo `.env` na raiz do projeto:

```bash
# .env
VITE_SUPABASE_URL=https://rinszzwdteaytefdwwnc.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_aqui
```

### 2. **Instalar Dependências**

```bash
npm install
```

### 3. **Build da Aplicação**

```bash
npm run build
```

### 4. **Sincronizar com Android**

```bash
npx cap sync android
```

### 5. **Abrir no Android Studio**

```bash
npx cap open android
```

### 6. **Executar no Dispositivo**

No Android Studio:
1. Conectar dispositivo USB ou iniciar emulador
2. Clicar em "Run" (▶️)
3. Aguardar instalação
4. App será aberto automaticamente

---

## 🔑 **Configurar Google Maps API** (Opcional)

Se for usar mapas, adicione a API key em:
`android/app/src/main/AndroidManifest.xml`

```xml
<application>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="SUA_GOOGLE_MAPS_API_KEY"/>
</application>
```

---

## 🧪 **Primeiro Teste**

1. **Fazer Login**
   - Abrir app
   - Usar credenciais de teste

2. **Aceitar Permissões**
   - Localização ✅
   - Câmera ✅
   - Notificações ✅

3. **Testar GPS**
   - Ver localização no mapa
   - Verificar precisão

4. **Testar Chat**
   - Enviar mensagem
   - Compartilhar localização

---

## 🐛 **Resolver Problemas Comuns**

### **Erro: "VITE_SUPABASE_URL is not defined"**
```bash
# Criar arquivo .env com as variáveis corretas
# Fazer build novamente
npm run build
npx cap sync android
```

### **App não abre/trava**
```bash
# Limpar build
cd android
./gradlew clean
cd ..

# Rebuild
npm run build:mobile
npx cap open android
```

### **GPS não funciona**
1. Verificar permissões no Android
2. Ativar localização no dispositivo
3. Testar em local aberto (não indoor)

### **Build falha no Android Studio**
```bash
# Atualizar Gradle
cd android
./gradlew wrapper --gradle-version 8.2

# Sync project
File > Sync Project with Gradle Files
```

---

## 📱 **Comandos Úteis**

### **Desenvolvimento Rápido**
```bash
# Build + Sync + Abrir em um comando
npm run android
```

### **Ver Logs em Tempo Real**
```bash
npx cap run android -l
```

### **Inspecionar WebView (Chrome DevTools)**
1. Abrir Chrome
2. Ir para `chrome://inspect`
3. Selecionar seu dispositivo
4. Clicar em "inspect"

### **Rebuild Completo**
```bash
npm run build
npx cap sync android
npx cap open android
```

---

## ✅ **Checklist Pré-Deploy**

- [ ] Arquivo `.env` configurado
- [ ] Build sem erros
- [ ] Sync completado
- [ ] App abre no emulador/dispositivo
- [ ] Login funciona
- [ ] GPS captura localização
- [ ] Permissões solicitadas corretamente

---

## 🎯 **Próximos Passos**

1. ✅ App rodando localmente
2. 🧪 Executar testes (ver TESTE_ANDROID.md)
3. 🎨 Ajustar UI/UX se necessário
4. 🔒 Configurar signing para produção
5. 📦 Gerar APK/AAB
6. 🚀 Publicar na Play Store

---

## 📚 **Documentação Adicional**

- **ANDROID_MIGRATION_COMPLETE.md** - Documentação completa de funcionalidades
- **TESTE_ANDROID.md** - Checklist de testes detalhado
- **SUPABASE_INTEGRATION.md** - Integração com Supabase (pasta android/)

---

**Dúvidas?** Consulte a documentação completa ou os arquivos de configuração.
