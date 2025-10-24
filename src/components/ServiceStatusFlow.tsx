import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  Camera, 
  MessageSquare,
  Phone,
  Navigation,
  Star
} from 'lucide-react';
import { useCamera } from '@/hooks/use-camera';
import { useHaptics } from '@/hooks/use-haptics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RatingDialog from './RatingDialog';
import ChatDialog from './ChatDialog';

interface ServiceStatusFlowProps {
  service: any;
  isMotoboy?: boolean;
  onUpdate: () => void;
}

const ServiceStatusFlow = ({ service, isMotoboy = false, onUpdate }: ServiceStatusFlowProps) => {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [canRate, setCanRate] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const { photo, takePicture } = useCamera();
  const haptics = useHaptics();

  useEffect(() => {
    getCurrentUser();
    checkRatingStatus();
    getOtherUserProfile();
  }, [service]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(profile);
      
      // After getting current user, get the other user's profile
      if (profile && service) {
        setTimeout(() => getOtherUserProfile(), 100);
      }
    }
  };

  const checkRatingStatus = async () => {
    if (!service || service.status !== 'completed') {
      setCanRate(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user already rated this service
    const { data: existingRating } = await supabase
      .from('ratings')
      .select('id')
      .eq('service_id', service.id)
      .eq('from_user_id', user.id)
      .single();

    setHasRated(!!existingRating);
    
    // Can rate if service is completed and user hasn't rated yet
    const isCompany = user.id === service.company_id;
    const isMotoboy = user.id === service.motoboy_id;
    setCanRate((isCompany || isMotoboy) && !existingRating);
  };

  const getOtherUserProfile = async () => {
    if (!service || !currentUser) return;
    
    // Get the other user's profile (company if current user is motoboy, or vice versa)
    const otherUserId = currentUser?.id === service.company_id 
      ? service.motoboy_id 
      : service.company_id;
    
    if (otherUserId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', otherUserId)
        .single();
      
      setOtherUserProfile(profile);
    }
  };

  const statusConfig = {
    available: {
      label: 'Disponível',
      color: 'bg-blue-500',
      icon: Package,
      description: 'Aguardando motoboy'
    },
    accepted: {
      label: 'Aceita',
      color: 'bg-yellow-500',
      icon: Clock,
      description: 'Motoboy a caminho da coleta'
    },
    collected: {
      label: 'Coletada',
      color: 'bg-orange-500',
      icon: Truck,
      description: 'A caminho do destino'
    },
    in_progress: {
      label: 'Em Entrega',
      color: 'bg-purple-500',
      icon: Navigation,
      description: 'Indo para o destino'
    },
    completed: {
      label: 'Concluída',
      color: 'bg-green-500',
      icon: CheckCircle,
      description: 'Entrega realizada'
    }
  };

  const currentStatus = statusConfig[service.status as keyof typeof statusConfig];
  const statusOrder = ['available', 'accepted', 'collected', 'in_progress', 'completed'];
  const currentIndex = statusOrder.indexOf(service.status);

  const updateServiceStatus = async (newStatus: string, photoUrl?: string, additionalData?: any) => {
    try {
      setLoading(true);
      haptics.medium();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const updateData: any = {
        status: newStatus,
        ...additionalData
      };

      // If accepting the service, add motoboy_id
      if (newStatus === 'accepted') {
        updateData.motoboy_id = user.id;
      }
      
      // Only add timestamps if they're likely to exist in the database
      // For now, we'll only update status and motoboy_id to avoid column errors

      const { error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', service.id);

      if (error) throw error;

      haptics.success();
      toast.success(`Status atualizado para: ${statusConfig[newStatus as keyof typeof statusConfig]?.label}`);
      onUpdate();
    } catch (error: any) {
      haptics.error();
      toast.error('Erro ao atualizar status: ' + error.message);
    } finally {
      setLoading(false);
      setNotes('');
    }
  };

  const handleAcceptService = () => {
    updateServiceStatus('accepted');
  };

  const handleCollectService = async () => {
    let photoUrl = null;
    if (photo) {
      // Here you would upload the photo to Supabase Storage
      // For now, we'll just use the local photo
      photoUrl = photo.webPath;
    }
    updateServiceStatus('collected', photoUrl);
  };

  const handleCompleteService = async () => {
    let photoUrl = null;
    if (photo) {
      // Upload photo of delivery confirmation
      photoUrl = photo.webPath;
    }
    updateServiceStatus('completed', photoUrl);
  };

  const getNextAction = () => {
    if (!isMotoboy) return null;

    switch (service.status) {
      case 'available':
        return (
          <Button onClick={handleAcceptService} disabled={loading} className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Aceitar Corrida
          </Button>
        );
      
      case 'accepted':
        return (
          <div className="space-y-3">
            <Button 
              onClick={() => window.open(`https://maps.google.com/dir/?api=1&destination=${service.pickup_location}`, '_blank')}
              variant="outline"
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navegar para Coleta
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Package className="h-4 w-4 mr-2" />
                  Confirmar Coleta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmar Coleta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Observações sobre a coleta (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button onClick={takePicture} variant="outline" className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Tirar Foto (Opcional)
                  </Button>
                  {photo && (
                    <img src={photo.webPath} alt="Foto da coleta" className="w-full h-32 object-cover rounded" />
                  )}
                  <Button onClick={handleCollectService} disabled={loading} className="w-full">
                    Confirmar Coleta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      
      case 'collected':
      case 'in_progress':
        return (
          <div className="space-y-3">
            <Button 
              onClick={() => window.open(`https://maps.google.com/dir/?api=1&destination=${service.delivery_location}`, '_blank')}
              variant="outline"
              className="w-full"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navegar para Destino
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalizar Entrega
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Finalizar Entrega</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Observações sobre a entrega (opcional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <Button onClick={takePicture} variant="outline" className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Foto de Confirmação
                  </Button>
                  {photo && (
                    <img src={photo.webPath} alt="Foto da entrega" className="w-full h-32 object-cover rounded" />
                  )}
                  <Button onClick={handleCompleteService} disabled={loading} className="w-full">
                    Confirmar Entrega
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        {/* Status Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Status da Corrida</h3>
            <Badge className={`${currentStatus?.color} text-white`}>
              {currentStatus?.label}
            </Badge>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            {statusOrder.slice(1).map((status, index) => {
              const isActive = index <= currentIndex - 1;
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config.icon;
              
              return (
                <div key={status} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    ${isActive ? config.color + ' text-white' : 'bg-gray-200 text-gray-400'}
                  `}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < statusOrder.slice(1).length - 1 && (
                    <div className={`
                      w-8 h-0.5 mx-1
                      ${isActive ? 'bg-primary' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            {currentStatus?.description}
          </p>
        </div>

        {/* Service Info */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start space-x-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">De: {service.pickup_location}</p>
              <p className="text-muted-foreground">Para: {service.delivery_location}</p>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">R$ {service.price?.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">{service.service_type}</span>
          </div>
        </div>

        {/* Communication */}
        {service.status !== 'available' && service.status !== 'completed' && otherUserProfile && (
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShowChatDialog(true)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => {
                toast.info("Funcionalidade de ligação em desenvolvimento");
              }}
            >
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
          </div>
        )}

        {/* Action Button */}
        {getNextAction()}

        {/* Rating Section */}
        {service.status === 'completed' && (
          <div className="mt-4 pt-4 border-t">
            {canRate && (
              <Button 
                onClick={() => setShowRatingDialog(true)}
                variant="outline" 
                className="w-full"
              >
                <Star className="h-4 w-4 mr-2" />
                Avaliar {isMotoboy ? 'Empresa' : 'Motoboy'}
              </Button>
            )}
            
            {hasRated && (
              <div className="text-center text-sm text-muted-foreground">
                ✓ Você já avaliou este serviço
              </div>
            )}

            {/* Show existing ratings */}
            <div className="mt-3 space-y-2">
              {service.company_rating && (
                <div className="flex justify-between items-center text-sm">
                  <span>Avaliação da Empresa:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: service.company_rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1">({service.company_rating}/5)</span>
                  </div>
                </div>
              )}
              
              {service.motoboy_rating && (
                <div className="flex justify-between items-center text-sm">
                  <span>Avaliação do Motoboy:</span>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: service.motoboy_rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1">({service.motoboy_rating}/5)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Rating Dialog */}
      {showRatingDialog && currentUser && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          serviceId={service.id}
          toUserId={isMotoboy ? service.company_id : service.motoboy_id}
          userType={currentUser.role}
          onSuccess={() => {
            onUpdate();
            checkRatingStatus();
          }}
        />
      )}

      {/* Chat Dialog */}
      {showChatDialog && currentUser && otherUserProfile && (
        <ChatDialog
          open={showChatDialog}
          onOpenChange={setShowChatDialog}
          serviceId={service.id}
          receiverId={otherUserProfile.id}
          receiverName={otherUserProfile.full_name}
          receiverAvatar={otherUserProfile.avatar_url}
        />
      )}
    </Card>
  );
};

export default ServiceStatusFlow;
