#!/usr/bin/env node

/**
 * Script para auxiliar na geração de recursos para o app
 * Use este script para verificar e gerar ícones/splash screens
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 MotoFreela - Gerador de Recursos\n');

// Verificar se a pasta resources existe
const resourcesDir = path.join(__dirname, 'resources');
if (!fs.existsSync(resourcesDir)) {
  console.log('📁 Criando pasta resources...');
  fs.mkdirSync(resourcesDir);
}

// Verificar se os arquivos necessários existem
const iconPath = path.join(resourcesDir, 'icon.png');
const splashPath = path.join(resourcesDir, 'splash.png');

console.log('Verificando recursos necessários:\n');

if (fs.existsSync(iconPath)) {
  console.log('✅ icon.png encontrado');
} else {
  console.log('❌ icon.png NÃO encontrado');
  console.log('   → Crie um ícone 1024x1024px em resources/icon.png');
}

if (fs.existsSync(splashPath)) {
  console.log('✅ splash.png encontrado');
} else {
  console.log('❌ splash.png NÃO encontrado');
  console.log('   → Crie um splash screen 2732x2732px em resources/splash.png');
}

console.log('\n📋 Especificações dos recursos:\n');
console.log('Ícone (icon.png):');
console.log('  - Tamanho: 1024x1024 pixels');
console.log('  - Formato: PNG com transparência');
console.log('  - Cores: Laranja (#FF6B35) como principal');
console.log('  - Design: Logo do motoboy estilizado');

console.log('\nSplash Screen (splash.png):');
console.log('  - Tamanho: 2732x2732 pixels');
console.log('  - Formato: PNG');
console.log('  - Fundo: Gradiente laranja (#FF6B35)');
console.log('  - Logo: Centralizado, 40% da largura');

console.log('\n🚀 Próximos passos:\n');

if (!fs.existsSync(iconPath) || !fs.existsSync(splashPath)) {
  console.log('1. Crie os arquivos icon.png e splash.png na pasta resources/');
  console.log('2. Execute: npm install -g cordova-res');
  console.log('3. Execute: cordova-res android --skip-config --copy');
  console.log('4. Execute: cordova-res ios --skip-config --copy');
} else {
  console.log('✅ Recursos encontrados! Execute os comandos:');
  console.log('\n  npm install -g cordova-res');
  console.log('  cordova-res android --skip-config --copy');
  console.log('  cordova-res ios --skip-config --copy');
}

console.log('\n💡 Dica: Use ferramentas online como:');
console.log('   - Canva (https://canva.com)');
console.log('   - Figma (https://figma.com)');
console.log('   - Adobe Express (https://express.adobe.com)');

console.log('\n📖 Consulte o arquivo DEPLOYMENT.md para mais informações.\n');
