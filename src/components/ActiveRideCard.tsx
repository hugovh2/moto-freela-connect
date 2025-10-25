import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Package,
  Camera, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Navigation,
  MessageSquare,
  Clock,
  Truck,
  DollarSign,
  CheckCheck,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LiveTracking } from '@/components/LiveTracking';

interface ActiveRideCardProps {
  service: {
    id: string;
    title: string;
    status: string;
    pickup_location: string;
    delivery_location: string;
    price: number;
    accepted_at?: string;
    company_id: string;
    motoboy_id: string;
    distance_km?: number;
    estimated_time_minutes?: number;
  };
  isMotoboy: boolean;
  onUpdate: () => void;
  onOpenChat: () => void;
}

export const ActiveRideCard = ({ 
  service, 
  isMotoboy, 
  onUpdate,
  onOpenChat 
}: ActiveRideCardProps) => {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  // Timer de corrida
  useEffect(() => {
    if (!service.accepted_at) return;

    const interval = setInterval(() => {
      const start = new Date(service.accepted_at!);
      const now = new Date();
      const diff = now.getTime() - start.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setElapsedTime(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [service.accepted_at]);

  // Progresso baseado no status
  const getProgress = () => {
    switch (service.status) {
      case 'pending': return 0;
      case 'accepted': return 25;
      case 'collected': return 50;
      case 'on_route': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case 'pending': return 'Aguardando Coleta';
      case 'accepted': return 'Aceito';
      case 'collected': return 'Coletado';
      case 'on_route': return 'A Caminho';
      case 'delivered': return 'Entregue';
      default: return service.status;
    }
  };

  const getStatusBadgeVariant = () => {
    switch (service.status) {
      case 'pending': return 'secondary';
      case 'accepted': return 'default';
      case 'collected': return 'default';
      case 'on_route': return 'default';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  const getNextAction = () => {
    switch (service.status) {
      case 'available':
        return {
          text: 'Aceitar Corrida',
          icon: CheckCircle,
          nextStatus: 'accepted',
          description: 'Aceitar a corrida e iniciar o serviço'
        };
      case 'pending':
      case 'accepted':
        return { 
          text: 'Coletar Pedido', 
          icon: Package, 
          nextStatus: 'collected',
          description: 'Confirmar que coletou o pedido'
        };
      case 'on_route':
        return { 
          text: 'Entregar', 
          icon: CheckCheck, 
          nextStatus: 'delivered',
          description: 'Confirmar entrega ao cliente'
        };
      default: return null;
    }
  };

  // Upload de foto
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploadingPhoto(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Upload para Supabase Storage - CORRIGIDO: não duplicar 'service-photos'
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${service.id}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('service-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública; se bucket não for público, criar signed URL como fallback
      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      let finalUrl: string | null = urlData.publicUrl || null;

      // Fallback: criar signed URL se a URL pública não estiver acessível
      if (!finalUrl || !finalUrl.includes('/object/public/')) {
        const { data: signedData, error: signError } = await supabase.storage
          .from('service-photos')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 ano
        if (signError || !signedData?.signedUrl) {
          console.error('Erro ao gerar signed URL:', signError);
          throw new Error('Não foi possível gerar URL de acesso à foto');
        }
        finalUrl = signedData.signedUrl;
      }

      setPhotoUrl(finalUrl);

      // Atualizar no banco de dados (TypeScript pode não reconhecer photo_url ainda)
      const { error: updateError } = await supabase
        .from('services')
        .update({ photo_url: finalUrl } as any)
        .eq('id', service.id);

      if (updateError) {
        console.error('Erro ao atualizar photo_url:', updateError);
      }

      toast.success('Foto enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      toast.error(error.message || 'Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Creditar valor ao motoboy
  const creditMotoboyWallet = async (amount: number): Promise<boolean> => {
    try {
      console.log('[ActiveRideCard] Creditando motoboy...', { serviceId: service.id, amount });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Inserir transação na wallet
      const { error: transactionError } = await (supabase as any)
        .from('transactions')
        .insert({
          user_id: service.motoboy_id,
          amount: amount,
          type: 'credit',
          description: `Corrida #${service.id.slice(0, 8)} - ${service.title}`,
          service_id: service.id,
          status: 'completed'
        });

      if (transactionError) {
        console.error('[ActiveRideCard] Erro ao criar transação:', transactionError);
        throw new Error('Erro ao processar pagamento');
      }

      console.log('[ActiveRideCard] ✅ Transação criada com sucesso');
      return true;
    } catch (error: any) {
      console.error('[ActiveRideCard] Erro ao creditar:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
      return false;
    }
  };

  // Atualizar status da corrida com lógica de transição
  const updateRideStatus = async (newStatus: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      console.log('[ActiveRideCard] Atualizando status:', { from: service.status, to: newStatus });

      // Validar transição
      const validStatuses = ['available', 'pending', 'accepted', 'collected', 'on_route', 'delivered', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Status inválido: ${newStatus}`);
      }

      // Atualizar status no banco
      let updateObj: any = { status: newStatus, updated_at: new Date().toISOString() };
      // Se aceitando corrida, definir motoboy_id
      if (newStatus === 'accepted') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');
        updateObj.motoboy_id = user.id;
      }

      const { error } = await supabase
        .from('services')
        .update(updateObj)
        .eq('id', service.id);

      if (error) {
        console.error('[ActiveRideCard] Erro Supabase:', error);
        throw new Error(`Erro ao atualizar: ${error.message}`);
      }

      // Feedback por status
      if (newStatus === 'accepted') {
        toast.success('Corrida aceita com sucesso!');
        onUpdate();
      } else if (newStatus === 'collected') {
        toast.success('✅ Pedido coletado!');
        setTimeout(async () => {
          console.log('[ActiveRideCard] Transição automática: collected → on_route');
          await updateToOnRoute();
        }, 1500);
      } else if (newStatus === 'delivered') {
        await handleDeliveryComplete();
      } else {
        toast.success(`Status atualizado: ${getStatusText()}`);
      }
    } catch (error: any) {
      console.error('[ActiveRideCard] Erro:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Transição automática para on_route
  const updateToOnRoute = async () => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ 
          status: 'on_route' as any,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', service.id);

      if (error) throw error;

      toast.success('🚴 A caminho da entrega!');
      // NÃO chamar onUpdate() - mantém card visível durante entrega
      // Forçar re-render local apenas
      setIsProcessing(false);
    } catch (error: any) {
      console.error('[ActiveRideCard] Erro na transição automática:', error);
    }
  };

  // Completar entrega com crédito
  const handleDeliveryComplete = async () => {
    setIsCompleting(true);
    try {
      toast.loading('Processando entrega...');

      // 1. Creditar motoboy (APENAS se for motoboy)
      if (isMotoboy) {
        const credited = await creditMotoboyWallet(service.price);
        if (!credited) {
          throw new Error('Falha ao processar pagamento');
        }
      }

      toast.dismiss();
      
      if (isMotoboy) {
        toast.success(
          `🎉 Entrega concluída! R$ ${service.price.toFixed(2)} creditado`,
          { duration: 5000 }
        );

        // 2. Animação de fade out (APENAS para motoboy)
        setTimeout(() => {
          setFadeOut(true);
        }, 2000);

        // 3. Remover card da UI após animação (APENAS para motoboy)
        setTimeout(() => {
          onUpdate(); // Recarrega lista - card não voltará pois status=delivered
        }, 2500);
      } else {
        // Empresa apenas vê feedback
        toast.success('✅ Entrega concluída com sucesso!', { duration: 3000 });
        // Card permanece visível para empresa
      }
    } catch (error: any) {
      toast.dismiss();
      console.error('[ActiveRideCard] Erro ao completar:', error);
      toast.error(error.message || 'Erro ao completar entrega');
    } finally {
      setIsCompleting(false);
    }
  };

  // Botão de emergência
  const handleEmergency = async () => {
    toast.error('🚨 ALERTA DE EMERGÊNCIA ACIONADO');
    
    try {
      // Enviar notificação para ambas as partes
      const { data: { user } } = await supabase.auth.getUser();
      
      // Aqui você pode integrar com serviços de emergência, SMS, etc.
      console.log('EMERGÊNCIA:', { serviceId: service.id, userId: user?.id });
      
      // Compartilhar localização
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Localização de emergência:', { latitude, longitude });
          
          // Pode enviar para um endpoint de emergência
          toast.info(`Localização compartilhada: ${latitude}, ${longitude}`);
        });
      }
    } catch (error) {
      console.error('Erro ao acionar emergência:', error);
    }
  };

  const nextAction = getNextAction();

  // Não renderizar apenas se for MOTOBOY, entregue e fadeOut
  if (isMotoboy && service.status === 'delivered' && fadeOut) {
    return null;
  }

  return (
    <Card 
      className={`border-2 border-primary transition-all duration-500 ${
        fadeOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      } ${
        isCompleting ? 'animate-pulse' : ''
      }`}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant()}>
                {service.status === 'on_route' && <Truck className="h-3 w-3 mr-1" />}
                {service.status === 'collected' && <Package className="h-3 w-3 mr-1" />}
                {service.status === 'delivered' && <CheckCheck className="h-3 w-3 mr-1" />}
                {getStatusText()}
              </Badge>
              {isCompleting && (
                <Badge variant="default" className="bg-green-500">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Creditando...
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Timer className="h-5 w-5" />
              {elapsedTime}
            </div>
            <p className="text-sm text-muted-foreground">
              {service.accepted_at && formatDistanceToNow(new Date(service.accepted_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress 
            value={getProgress()} 
            className={`h-2 transition-all ${
              service.status === 'delivered' ? 'bg-green-200' : ''
            }`} 
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={service.status === 'pending' || service.status === 'accepted' ? 'font-semibold text-primary' : ''}>Aceito</span>
            <span className={service.status === 'collected' ? 'font-semibold text-primary' : ''}>Coletado</span>
            <span className={service.status === 'on_route' ? 'font-semibold text-primary' : ''}>A Caminho</span>
            <span className={service.status === 'delivered' ? 'font-semibold text-green-600' : ''}>Entregue</span>
          </div>
        </div>

        {/* Localização */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium">De:</p>
              <p className="text-muted-foreground">{service.pickup_location}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Para:</p>
              <p className="text-muted-foreground">{service.delivery_location}</p>
            </div>
          </div>
        </div>

        {/* Valor */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="font-medium">Valor:</span>
          <span className="text-xl font-bold text-primary">
            R$ {service.price.toFixed(2)}
          </span>
        </div>

        {/* Distância e Tempo Estimado */}
        {(service.distance_km || service.estimated_time_minutes) && (
          <div className="grid grid-cols-2 gap-2">
            {service.distance_km && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Distância</p>
                  <p className="text-sm font-semibold">{service.distance_km.toFixed(1)} km</p>
                </div>
              </div>
            )}
            {service.estimated_time_minutes && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo Est.</p>
                  <p className="text-sm font-semibold">{service.estimated_time_minutes} min</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Foto Preview */}
        {photoUrl && (
          <div className="rounded-lg overflow-hidden">
            <img src={photoUrl} alt="Foto da entrega" className="w-full h-40 object-cover" />
          </div>
        )}

        {/* Ações para Motoboy */}
        {isMotoboy && (
          <div className="space-y-2">
            {/* Upload de Foto */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={uploadingPhoto}
                onClick={() => document.getElementById(`photo-upload-${service.id}`)?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                {uploadingPhoto ? 'Enviando...' : 'Tirar Foto'}
              </Button>
              <input
                id={`photo-upload-${service.id}`}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Próxima Ação */}
            {nextAction && (
              <div className="space-y-2">
                <Button
                  className="w-full relative overflow-hidden group"
                  onClick={() => updateRideStatus(nextAction.nextStatus)}
                  disabled={isProcessing || isCompleting}
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <nextAction.icon className="h-5 w-5 mr-2" />
                      {nextAction.text}
                    </>
                  )}
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  {nextAction.description}
                </p>
              </div>
            )}

            {/* Feedback de entrega concluída */}
            {service.status === 'delivered' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg animate-bounce-in">
                <div className="flex items-center gap-3">
                  <CheckCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Entrega Concluída!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      R$ {service.price.toFixed(2)} creditado na sua carteira
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visualização para EMPRESA - Rastreamento em Tempo Real */}
        {!isMotoboy && (
          <div className="space-y-4">
            {/* Status em Destaque */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Status da Entrega</h3>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-slate-800">
                  {service.status === 'on_route' && <Truck className="h-3 w-3 mr-1 animate-pulse" />}
                  {service.status === 'collected' && <Package className="h-3 w-3 mr-1" />}
                  {service.status === 'delivered' && <CheckCheck className="h-3 w-3 mr-1" />}
                  {getStatusText()}
                </Badge>
              </div>
              
              {/* Mensagens por status */}
              {service.status === 'pending' && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  ⏳ Aguardando motoboy coletar o pedido...
                </p>
              )}
              {service.status === 'accepted' && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🏃 Motoboy a caminho da coleta...
                </p>
              )}
              {service.status === 'collected' && (
                <p className="text-sm text-blue-700 dark:text-blue-300 animate-pulse">
                  📦 Pedido coletado! Preparando rota...
                </p>
              )}
              {service.status === 'on_route' && (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🚴 Motoboy a caminho da entrega! Acompanhe no mapa abaixo.
                </p>
              )}
              {service.status === 'delivered' && (
                <div className="space-y-2">
                  <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                    ✅ Pedido entregue com sucesso!
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Obrigado por usar nosso serviço!
                  </p>
                </div>
              )}
            </div>

            {/* Rastreamento em Tempo Real */}
            {(service.status === 'on_route' || service.status === 'collected') && (
              <LiveTracking
                serviceId={service.id}
                motoboyId={service.motoboy_id}
                pickupLocation={service.pickup_location}
                deliveryLocation={service.delivery_location}
              />
            )}

            {/* Informações Adicionais para Empresa */}
            {service.status === 'delivered' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">
                      Entrega Concluída!
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Valor pago: R$ {service.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ações Comuns */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={onOpenChat}>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              const destination = isMotoboy && service.status === 'accepted' 
                ? service.pickup_location 
                : service.delivery_location;
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
            }}
          >
            <Navigation className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleEmergency}
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
