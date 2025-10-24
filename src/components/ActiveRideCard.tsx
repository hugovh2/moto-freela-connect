import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Phone, 
  Camera, 
  CheckCircle, 
  AlertTriangle,
  Timer,
  Navigation,
  MessageSquare,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      case 'accepted': return 25;
      case 'collected': return 50;
      case 'in_progress': return 75;
      case 'completed': return 100;
      default: return 0;
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case 'accepted': return 'Indo buscar';
      case 'collected': return 'Item coletado';
      case 'in_progress': return 'Em entrega';
      case 'completed': return 'Concluído';
      default: return service.status;
    }
  };

  const getNextAction = () => {
    switch (service.status) {
      case 'accepted': return { text: 'Confirmar Coleta', nextStatus: 'collected' };
      case 'collected': return { text: 'Iniciar Entrega', nextStatus: 'in_progress' };
      case 'in_progress': return { text: 'Concluir Entrega', nextStatus: 'completed' };
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
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        throw new Error('Não foi possível obter URL da foto');
      }

      setPhotoUrl(urlData.publicUrl);
      
      // Atualizar no banco de dados (TypeScript pode não reconhecer photo_url ainda)
      const { error: updateError } = await supabase
        .from('services')
        .update({ photo_url: urlData.publicUrl } as any)
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

  // Atualizar status da corrida
  const updateRideStatus = async (newStatus: string) => {
    try {
      // Validar enum antes de enviar
      const validStatuses = ['available', 'accepted', 'collected', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Status inválido: ${newStatus}. Use um dos valores: ${validStatuses.join(', ')}`);
      }

      const updates: any = { status: newStatus };

      // Adicionar timestamps conforme o status
      const now = new Date().toISOString();
      if (newStatus === 'collected') {
        updates.collected_at = now;
      } else if (newStatus === 'in_progress') {
        updates.in_progress_at = now;
      } else if (newStatus === 'completed') {
        updates.completed_at = now;
      }

      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', service.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Erro ao atualizar: ${error.message}`);
      }

      toast.success(`Status atualizado: ${getStatusText()}`);
      onUpdate();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
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

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{service.title}</CardTitle>
            <Badge variant="secondary">{getStatusText()}</Badge>
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
          <Progress value={getProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Aceito</span>
            <span>Coletado</span>
            <span>Em entrega</span>
            <span>Concluído</span>
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
              <Button
                className="w-full"
                onClick={() => updateRideStatus(nextAction.nextStatus)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {nextAction.text}
              </Button>
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
