# 🏍️ MotoFreela - Especificação Completa do Projeto

## 📋 Visão Geral

**MotoFreela** é uma plataforma digital que conecta motoboys autônomos com empresas que necessitam de serviços de entrega e logística rápida. Funciona como um marketplace bidirecional, onde empresas publicam demandas e motoboys aceitam e executam serviços.

### 🎯 Objetivos Principais

- **Democratizar** acesso a serviços de entrega para empresas de todos os portes
- **Gerar oportunidades** de trabalho flexível para motoboys autônomos  
- **Otimizar** logística urbana através de tecnologia e geolocalização
- **Garantir transparência** e segurança através de avaliações e histórico

---

## 👥 Personas e Fluxos de Uso

### 🏢 Empresa (Cliente)

**Fluxo Típico:**
1. Login → Criar novo serviço (origem, destino, tipo, valor)
2. Aguardar aceitação de motoboy
3. Receber notificação → Acompanhar em tempo real
4. Confirmar conclusão → Avaliar motoboy

**Necessidades:**
- Publicar entregas de forma rápida
- Visualizar motoboys disponíveis próximos
- Acompanhar status em tempo real
- Gerenciar histórico e custos

### 🏍️ Motoboy (Prestador)

**Fluxo Típico:**
1. Login → Ativar disponibilidade
2. Visualizar mapa com serviços próximos → Filtrar
3. Aceitar corrida → Navegar até coleta
4. Coletar item → Navegar até destino
5. Entregar → Marcar concluído → Avaliar empresa

**Necessidades:**
- Visualizar oportunidades próximas
- Aceitar corridas compatíveis
- Navegar e comunicar-se com cliente
- Receber pagamento seguro
- Construir reputação

---

## ⚙️ Funcionalidades Detalhadas

### 1. 🔐 Autenticação e Perfis

#### Sistema de Cadastro
- **Tipos**: Motoboy | Empresa
- **Métodos**: Email/senha, OAuth Google, OAuth Facebook
- **Validações**: CPF/CNPJ, CNH (upload foto), verificação telefone/SMS

#### Perfil Motoboy
```typescript
interface MotoboyProfile {
  nome: string;
  foto: string;
  cnh: string;
  telefone: string;
  veiculo: { modelo, placa, ano, cor };
  avaliacaoMedia: number;
  totalCorridas: number;
  taxaAceitacao: number;
  documentosVerificados: boolean;
  statusAtivo: boolean;
  localizacaoAtual?: { lat, lng, timestamp };
}
```

#### Perfil Empresa
```typescript
interface EmpresaProfile {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj?: string;
  logo: string;
  telefone: string;
  endereco: EnderecoCompleto;
  avaliacaoMedia: number;
  totalServicos: number;
}
```

### 2. 📦 Sistema de Serviços

#### Criação de Serviço (Empresa)

**Formulário Completo:**
- **Tipo**: Alimentos, Documentos, Encomendas, Coleta-Entrega, Outros
- **Origem**: Endereço (autocomplete), ponto no mapa, contato, observações
- **Destino**: Endereço, ponto no mapa, contato, observações  
- **Detalhes**: Descrição item, peso/tamanho, valor R$, prazo, requisitos especiais
- **Pagamento**: Plataforma, Direto ao motoboy, A combinar

#### Schema de Serviço
```typescript
interface Servico {
  id: string;
  empresaId: string;
  motoboyId?: string;
  tipo: TipoServico;
  status: 'disponivel' | 'aceito' | 'coletado' | 'em-entrega' | 'concluido' | 'cancelado';
  origem: { endereco, coordenadas, contato, observacoes };
  destino: { endereco, coordenadas, contato, observacoes };
  descricao: string;
  valor: number;
  distanciaKm: number;
  tempoEstimado: number;
  requisitos?: string[];
  formaPagamento: string;
  timestamps: { criado, aceito, concluido };
  avaliacoes: { empresa?, motoboy? };
}
```

#### Exploração de Serviços (Motoboy)

**Visualizações:**
- **Mapa**: Pins coloridos por tipo, raio ajustável (1-20km), rota estimada
- **Lista**: Cards com info resumida, ordenação (distância/valor/recente), badges urgência

**Filtros:**
- Distância máxima
- Valor mínimo
- Tipo de serviço
- Forma de pagamento

**Card de Serviço:**
```
┌─────────────────────────────────────┐
│ 🍔 Entrega de Alimentos             │
│ ⭐ Restaurante Bom Sabor - 4.8      │
│ 📍 2.3 km | 💰 R$ 15,00 | ⏱️ ~15min │
│ De: Rua A, 100 → Av. B, 500         │
│ [Ver Detalhes] [Aceitar Corrida] 🏍️ │
└─────────────────────────────────────┘
```

#### Gerenciamento de Corrida Ativa

**Status e Ações:**
1. **Aceito**: Navegação até origem
2. **Coletado**: Confirmar coleta + foto opcional
3. **Em Entrega**: Navegação até destino  
4. **Concluído**: Confirmar entrega + foto + assinatura digital

**Recursos:**
- Botão emergência/ajuda
- Chat com empresa
- Telefone direto
- Compartilhar localização em tempo real
- Timer de corrida

### 3. 📊 Painéis de Controle

#### Dashboard Empresa
- Total gasto mês, entregas realizadas/ativas, avaliação média
- Seções: Criar serviço, Serviços ativos, Histórico, Motoboys favoritos, Relatórios

#### Dashboard Motoboy  
- Ganhos hoje/semana/mês, corridas totais, avaliação, taxa aceitação
- Toggle: Disponível/Indisponível
- Corrida ativa, Serviços próximos, Histórico ganhos, Ranking

### 4. 💬 Comunicação

#### Chat Integrado
- Ativado após aceitação
- Tempo real (WebSocket/Supabase Realtime)
- Histórico salvo
- Indicador "digitando..."
- Envio: localização, fotos
- Mensagens rápidas: "A caminho", "Cheguei", "Entrega concluída"

#### Notificações Push (FCM)
- Novo serviço próximo
- Serviço aceito/concluído
- Motoboy chegou
- Nova mensagem
- Avaliação recebida

### 5. ⭐ Sistema de Avaliações

**Bidirecional (1-5 estrelas + comentário):**

**Empresa → Motoboy:**
- Critérios: Pontualidade, Cuidado, Comunicação, Profissionalismo

**Motoboy → Empresa:**
- Critérios: Clareza, Cordialidade, Pontualidade, Valor justo

**Sistema de Reputação:**
- Média ponderada (peso maior para recentes)
- Badge "Top Rated" para 4.5+ com 50+ avaliações
- Sistema de denúncia

### 6. 🗺️ Google Maps API

**Funcionalidades:**
- Autocomplete endereços
- Geocoding / Reverse geocoding
- Cálculo distância e tempo
- Rotas otimizadas
- Tráfego em tempo real
- Pins customizados
- Raio de disponibilidade visual

### 7. 💳 Pagamentos (Opcional/Futuro)

**Métodos:**
- PIX (QR Code / Copia e Cola)
- Cartão de crédito
- Carteiras digitais (PicPay, Mercado Pago)

**Fluxo:**
1. Valor em custódia
2. Liberação após conclusão
3. Taxa plataforma deduzida
4. Saque disponível para motoboy

---

## 🎨 Design e UX

### Princípios
1. **Simplicidade**: Max 3 cliques para ações principais
2. **Clareza visual**: Hierarquia clara, tipografia legível
3. **Feedback imediato**: Confirmações visuais
4. **Responsividade**: Todos os dispositivos
5. **Acessibilidade**: Contraste, navegação teclado, leitores tela

### Paleta de Cores
```css
--primary: #FF6B35;      /* Laranja - ação */
--secondary: #004E89;    /* Azul escuro - confiança */
--accent: #00D9FF;       /* Azul claro - info */
--success: #10B981;      /* Verde */
--warning: #F59E0B;      /* Amarelo */
--error: #EF4444;        /* Vermelho */
--dark-bg: #1F2937;      /* Dark mode */
```

### Telas Essenciais

1. **Login/Cadastro**: Design dividido Empresas|Motoboys, OAuth destacado
2. **Home Empresa**: Card "Nova Entrega" CTA, entregas ativas, gráfico gastos
3. **Home Motoboy**: Toggle grande disponibilidade, mapa tela cheia, ganhos destaque
4. **Criar Serviço**: Wizard step-by-step, mapa interativo, preview
5. **Detalhes Serviço**: Layout card, mapa com rota, perfil usuário, chat minimizado
6. **Perfil**: Foto, dados, estatísticas, histórico avaliações

---

## 🛠️ Stack Tecnológico

### Frontend
```json
{
  "framework": "React 18+ com TypeScript",
  "build": "Vite",
  "styling": "Tailwind CSS",
  "componentes": "shadcn/ui",
  "icons": "Lucide React",
  "mapas": "@googlemaps/react-wrapper",
  "forms": "React Hook Form + Zod",
  "state": "Zustand / Context API",
  "routing": "React Router v6",
  "http": "Axios",
  "realtime": "Supabase Realtime"
}
```

### Backend (Supabase)
```json
{
  "autenticacao": "Supabase Auth",
  "database": "PostgreSQL",
  "storage": "Supabase Storage",
  "realtime": "Supabase Realtime",
  "functions": "Edge Functions (serverless)"
}
```

### Infraestrutura
```json
{
  "hosting": "Vercel / Netlify",
  "notificacoes": "Firebase Cloud Messaging",
  "analytics": "Google Analytics 4",
  "monitoring": "Sentry",
  "maps": "Google Maps Platform"
}
```

---

## 🗄️ Banco de Dados (PostgreSQL/Supabase)

### Tabelas Principais

```sql
-- Perfis de usuário
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tipo VARCHAR(10) CHECK (tipo IN ('motoboy', 'empresa')),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  foto_url TEXT,
  avaliacao_media DECIMAL(2,1) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Motoboys
CREATE TABLE motoboys (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  cnh VARCHAR(50),
  cnh_url TEXT,
  veiculo_modelo VARCHAR(100),
  veiculo_placa VARCHAR(20),
  veiculo_ano INTEGER,
  total_corridas INTEGER DEFAULT 0,
  status_ativo BOOLEAN DEFAULT false,
  localizacao_lat DECIMAL(10,8),
  localizacao_lng DECIMAL(11,8),
  localizacao_atualizada_em TIMESTAMP,
  documentos_verificados BOOLEAN DEFAULT false
);

-- Empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY REFERENCES profiles(id),
  razao_social VARCHAR(255),
  cnpj VARCHAR(18),
  logo_url TEXT,
  endereco_completo TEXT,
  total_servicos INTEGER DEFAULT 0,
  documentos_verificados BOOLEAN DEFAULT false
);

-- Serviços/Entregas
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  motoboy_id UUID REFERENCES motoboys(id),
  tipo VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'disponivel',
  origem_endereco TEXT NOT NULL,
  origem_lat DECIMAL(10,8) NOT NULL,
  origem_lng DECIMAL(11,8) NOT NULL,
  destino_endereco TEXT NOT NULL,
  destino_lat DECIMAL(10,8) NOT NULL,
  destino_lng DECIMAL(11,8) NOT NULL,
  descricao TEXT,
  valor DECIMAL(10,2) NOT NULL,
  distancia_km DECIMAL(8,2),
  tempo_estimado INTEGER,
  forma_pagamento VARCHAR(20),
  criado_em TIMESTAMP DEFAULT NOW(),
  aceito_em TIMESTAMP,
  concluido_em TIMESTAMP,
  avaliacao_empresa INTEGER CHECK (avaliacao_empresa >= 1 AND avaliacao_empresa <= 5),
  avaliacao_motoboy INTEGER CHECK (avaliacao_motoboy >= 1 AND avaliacao_motoboy <= 5)
);

-- Chat
CREATE TABLE mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  servico_id UUID REFERENCES servicos(id) NOT NULL,
  remetente_id UUID REFERENCES profiles(id) NOT NULL,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto',
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Notificações
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES profiles(id) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  lida BOOLEAN DEFAULT false,
  criado_em TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_servicos_status ON servicos(status);
CREATE INDEX idx_servicos_localizacao ON servicos USING GIST (ll_to_earth(origem_lat, origem_lng));
CREATE INDEX idx_mensagens_servico ON mensagens(servico_id);
```

### Row Level Security (RLS)

```sql
-- Profiles: Usuários só veem próprio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver próprio perfil" ON profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Atualizar próprio perfil" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Serviços: Empresas criam, motoboys veem disponíveis
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas criam serviços" ON servicos 
FOR INSERT WITH CHECK (auth.uid() = empresa_id);

CREATE POLICY "Motoboys veem disponíveis ou próprios" ON servicos 
FOR SELECT USING (status = 'disponivel' OR auth.uid() = motoboy_id);

CREATE POLICY "Motoboys atualizam próprios" ON servicos 
FOR UPDATE USING (auth.uid() = motoboy_id);
```

---

## 📱 Mobile (PWA + Capacitor)

### PWA (Progressive Web App)

**Configuração Vite:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MotoFreela',
        short_name: 'MotoFreela',
        theme_color: '#FF6B35',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: /^https:\/\/api\.*/i,
          handler: 'NetworkFirst'
        }]
      }
    })
  ]
});
```

### Capacitor (App Nativo)

**Instalação:**
```bash
npm install @capacitor/core @capacitor/cli
npx cap init MotoFreela com.motofreela.app
npx cap add android ios

# Plugins
npm install @capacitor/geolocation @capacitor/camera @capacitor/push-notifications
```

**Rastreamento GPS:**
```typescript
import { Geolocation } from '@capacitor/geolocation';

const watchId = await Geolocation.watchPosition(
  { enableHighAccuracy: true, timeout: 10000 },
  (position) => {
    const { latitude, longitude } = position.coords;
    updateMotoboyLocation(latitude, longitude);
  }
);
```

---

## ✨ Funcionalidades Extras

### Gamificação e Badges
- **Badges**: Primeiro Passo, 5 Estrelas, Semana Perfeita, Maratonista (100 corridas)
- **Ranking**: Mensal por cidade/estado
- **Multiplicadores**: Bônus em horários/dias específicos
- **Missões**: Desafios diários/semanais

### Dark Mode
- Toggle no perfil
- Preferência salva no localStorage
- Classes Tailwind automáticas

### Sistema de Favoritos
- Empresas favoritam motoboys confiáveis
- Motoboys favoritam empresas boas
- Notificação prioritária para favoritos

### Relatórios e Analytics
- **Empresas**: Gastos mensais, motoboys mais usados, horários pico
- **Motoboys**: Ganhos diários/mensais, corridas por região, tempos médios
- Exportação CSV/PDF

### Suporte Integrado
- Chat com suporte
- FAQ interativo
- Central de ajuda
- Botão emergência (aciona suporte + autoridades se necessário)

---

## 🚀 Roadmap de Implementação

### Fase 1: MVP (4-6 semanas)
- [ ] Autenticação (email/senha + Google)
- [ ] Perfis básicos (motoboy e empresa)
- [ ] CRUD de serviços
- [ ] Listagem e filtros
- [ ] Aceitar/concluir corridas
- [ ] Avaliações simples

### Fase 2: Funcionalidades Core (4-6 semanas)
- [ ] Integração Google Maps completa
- [ ] Rastreamento em tempo real
- [ ] Chat entre usuários
- [ ] Notificações push
- [ ] Dashboard com estatísticas
- [ ] Sistema de busca otimizado

### Fase 3: Melhorias e Extras (4-6 semanas)
- [ ] Dark mode
- [ ] Gamificação e badges
- [ ] Sistema de favoritos
- [ ] Relatórios avançados
- [ ] PWA completo
- [ ] Capacitor para apps nativos

### Fase 4: Escalabilidade (4-6 semanas)
- [ ] Sistema de pagamentos
- [ ] Painel administrativo
- [ ] Analytics avançados
- [ ] Otimizações de performance
- [ ] Testes automatizados
- [ ] Publicação nas stores

---

## 🔒 Segurança e Boas Práticas

### Segurança
- Autenticação JWT via Supabase
- RLS habilitado em todas tabelas
- Validação de dados (Zod)
- HTTPS obrigatório
- Rate limiting em APIs
- Sanitização de inputs

### Performance
- Lazy loading de componentes
- Debounce em buscas
- Cache de mapas
- Compressão de imagens
- Code splitting

### Monitoramento
- Sentry para erros
- Google Analytics eventos
- Logs estruturados
- Health checks
- Uptime monitoring

---

## 📚 Documentação Adicional

### Para Desenvolvedores
- Setup local do projeto
- Variáveis de ambiente (.env.example)
- Guia de contribuição
- Code style guide
- Git workflow

### Para Usuários
- Tutorial primeira utilização
- FAQ completo
- Termos de uso
- Política de privacidade
- Guia de segurança

---

## 🎯 Métricas de Sucesso

### KPIs Principais
- **Usuários ativos** (DAU/MAU)
- **Corridas completadas** por dia/semana
- **Tempo médio** de aceitação de corrida
- **Taxa de conclusão** de corridas
- **Avaliação média** geral da plataforma
- **Retenção** de usuários (D1, D7, D30)

### Metas Iniciais (3 meses)
- 500+ usuários cadastrados
- 1000+ corridas completadas
- 4.5+ avaliação média
- 80%+ taxa de conclusão
- 50%+ retenção D30

---

## 💡 Diferenciais Competitivos

1. **Interface intuitiva**: UX pensado para velocidade
2. **Tempo real**: Atualizações instantâneas via Supabase
3. **Transparência**: Avaliações e histórico completos
4. **Flexibilidade**: Múltiplos tipos de serviços
5. **Gamificação**: Engajamento através de badges e ranking
6. **Multi-plataforma**: Web, PWA, iOS, Android com mesmo código

---

## 📞 Contatos e Suporte

**Equipe de Desenvolvimento**
- Email: dev@motofreela.com
- Discord: [Link do servidor]
- GitHub: [Link do repositório]

**Suporte aos Usuários**
- WhatsApp: (XX) XXXXX-XXXX
- Email: suporte@motofreela.com
- Chat in-app: Disponível 24/7

---

**Versão do Documento**: 2.0  
**Última Atualização**: Janeiro 2025  
**Status**: Em Desenvolvimento Ativo 🚀
