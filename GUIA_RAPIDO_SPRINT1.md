# 🚀 GUIA RÁPIDO - SPRINT 1

## ⚡ Inicio Rápido

### 1. Configure o Banco de Dados
```bash
# Execute no SQL Editor do Supabase
supabase/SPRINT1_DATABASE_SETUP.sql
```

### 2. Habilite Realtime no Supabase
1. Acesse: **Database → Replication**
2. Habilite para:
   - ✅ messages
   - ✅ user_locations
   - ✅ services

### 3. Crie o Bucket de Fotos
1. Acesse: **Storage → Create Bucket**
2. Nome: `service-photos`
3. ✅ Marque "Public bucket"

---

## 📱 COMPONENTES CRIADOS

### 1️⃣ ChatWindow
**Localização:** `src/components/ChatWindow.tsx`

```tsx
import { ChatWindow } from '@/components/ChatWindow';

// Exemplo de uso
<ChatWindow
  serviceId="uuid-do-servico"
  receiverId="uuid-do-destinatario"
  receiverName="Nome do Destinatário"
  onClose={() => setChatOpen(false)}
  minimized={false}
  onToggleMinimize={() => setMinimized(!minimized)}
/>
```

**Props:**
- `serviceId` - ID do serviço
- `receiverId` - ID do usuário destinatário
- `receiverName` - Nome para exibir no header
- `onClose` - Callback para fechar
- `minimized` - Estado minimizado
- `onToggleMinimize` - Toggle minimizar

---

### 2️⃣ LiveTracking
**Localização:** `src/components/LiveTracking.tsx`

```tsx
import { LiveTracking } from '@/components/LiveTracking';

// Exemplo de uso (Dashboard Empresa)
<LiveTracking
  serviceId="uuid-do-servico"
  motoboyId="uuid-do-motoboy"
  pickupLocation="Endereço de origem"
  deliveryLocation="Endereço de destino"
/>
```

**Props:**
- `serviceId` - ID do serviço
- `motoboyId` - ID do motoboy para rastrear
- `pickupLocation` - Endereço de coleta
- `deliveryLocation` - Endereço de entrega

---

### 3️⃣ ActiveRideCard
**Localização:** `src/components/ActiveRideCard.tsx`

```tsx
import { ActiveRideCard } from '@/components/ActiveRideCard';

// Exemplo de uso (Dashboard Motoboy)
<ActiveRideCard
  service={activeService}
  isMotoboy={true}
  onUpdate={() => fetchServices()}
  onOpenChat={() => setChatOpen(true)}
/>
```

**Props:**
- `service` - Objeto do serviço ativo
- `isMotoboy` - true se for perfil motoboy
- `onUpdate` - Callback após atualizar status
- `onOpenChat` - Callback para abrir chat

---

## 🔥 EXEMPLO COMPLETO - Dashboard Motoboy

```tsx
import { useState, useEffect } from 'react';
import { ActiveRideCard } from '@/components/ActiveRideCard';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';

export const MotoboyDashboard = () => {
  const [myServices, setMyServices] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('motoboy_id', user.id)
      .in('status', ['accepted', 'collected', 'in_progress']);
    
    setMyServices(data || []);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Corridas Ativas</h2>
      
      {/* Lista de corridas ativas */}
      {myServices.map(service => (
        <ActiveRideCard
          key={service.id}
          service={service}
          isMotoboy={true}
          onUpdate={fetchServices}
          onOpenChat={() => {
            setSelectedService(service);
            setChatOpen(true);
          }}
        />
      ))}

      {/* Chat */}
      {chatOpen && selectedService && (
        <ChatWindow
          serviceId={selectedService.id}
          receiverId={selectedService.company_id}
          receiverName="Empresa"
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};
```

---

## 🏢 EXEMPLO COMPLETO - Dashboard Empresa

```tsx
import { useState, useEffect } from 'react';
import { LiveTracking } from '@/components/LiveTracking';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';

export const CompanyDashboard = () => {
  const [activeServices, setActiveServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('company_id', user.id)
      .in('status', ['accepted', 'collected', 'in_progress']);
    
    setActiveServices(data || []);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Entregas em Andamento</h2>
      
      {activeServices.map(service => (
        <div key={service.id} className="grid md:grid-cols-2 gap-6">
          {/* Tracking em tempo real */}
          {service.motoboy_id && (
            <LiveTracking
              serviceId={service.id}
              motoboyId={service.motoboy_id}
              pickupLocation={service.pickup_location}
              deliveryLocation={service.delivery_location}
            />
          )}

          {/* Chat com motoboy */}
          {service.motoboy_id && (
            <ChatWindow
              serviceId={service.id}
              receiverId={service.motoboy_id}
              receiverName="Motoboy"
            />
          )}
        </div>
      ))}
    </div>
  );
};
```

---

## 🎯 FUNCIONALIDADES POR COMPONENTE

### ActiveRideCard
✅ Timer em tempo real  
✅ Barra de progresso  
✅ Upload de fotos  
✅ Atualizar status (Coletado → Em entrega → Concluído)  
✅ Botão de emergência  
✅ Chat rápido  
✅ Navegação GPS  

### ChatWindow
✅ Mensagens em tempo real  
✅ Mensagens rápidas pré-definidas  
✅ Compartilhar localização  
✅ Indicador "digitando..."  
✅ Histórico completo  
✅ Minimizar/Expandir  
✅ Ligar diretamente  

### LiveTracking
✅ Mapa em tempo real  
✅ Localização do motoboy  
✅ Rota até o destino  
✅ ETA (tempo estimado)  
✅ Info do motoboy  
✅ Abrir no Google Maps  

---

## 🐛 TROUBLESHOOTING

### Chat não atualiza em tempo real
1. Verifique se Realtime está habilitado para `messages`
2. Confira se o canal está sendo subscrito corretamente
3. Veja logs no console: `[Supabase] Realtime connected`

### Mapa não carrega
1. Verifique a API Key do Google Maps no `.env`
2. Certifique-se que a API está habilitada no Google Cloud
3. Verifique se há localização do motoboy em `user_locations`

### Upload de foto falha
1. Verifique se o bucket `service-photos` existe
2. Confirme que as políticas de storage estão criadas
3. Confira tamanho da imagem (máx 5MB)

### Timer não inicia
1. Verifique se `accepted_at` está sendo salvo
2. Confira formato do timestamp (ISO 8601)
3. Verifique timezone do servidor

---

## 📊 MONITORAMENTO

### Verificar mensagens em tempo real
```sql
SELECT * FROM messages 
WHERE service_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar localização do motoboy
```sql
SELECT * FROM user_locations 
WHERE user_id = 'uuid' 
ORDER BY updated_at DESC 
LIMIT 1;
```

### Verificar status das corridas
```sql
SELECT 
  id, 
  status, 
  accepted_at, 
  collected_at, 
  in_progress_at, 
  completed_at 
FROM services 
WHERE motoboy_id = 'uuid' 
ORDER BY created_at DESC;
```

---

## 🎉 PRONTO!

Agora você tem:
- ✅ Chat em tempo real funcionando
- ✅ Rastreamento ao vivo configurado  
- ✅ Sistema de fotos operacional
- ✅ Timer de corrida ativo

**Teste tudo e bom trabalho!** 🚀
