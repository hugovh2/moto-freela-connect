import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LiveTrackingProps {
  serviceId: string;
  motoboyId: string;
  pickupLocation: string;
  deliveryLocation: string;
}

interface MotoboyLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

export const LiveTracking = ({
  serviceId,
  motoboyId,
  pickupLocation,
  deliveryLocation,
}: LiveTrackingProps) => {
  const [motoboyLocation, setMotoboyLocation] = useState<MotoboyLocation | null>(null);
  const [motoboyInfo, setMotoboyInfo] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    loadMotoboyInfo();
    subscribeToLocation();
  }, [motoboyId]);

  const loadMotoboyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', motoboyId)
        .single();

      if (error) throw error;
      setMotoboyInfo(data);
    } catch (error) {
      console.error('Erro ao carregar info do motoboy:', error);
    }
  };

  const subscribeToLocation = () => {
    setIsTracking(true);

    // Subscribe to real-time location updates
    const channel = supabase
      .channel(`location:${motoboyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${motoboyId}`,
        },
        (payload) => {
          const newLocation = payload.new as any;
          setMotoboyLocation({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            updated_at: newLocation.updated_at,
          });
        }
      )
      .subscribe();

    // Initial load
    loadCurrentLocation();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadCurrentLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude, updated_at')
        .eq('user_id', motoboyId)
        .single();

      if (error) throw error;
      if (data) {
        setMotoboyLocation(data);
      }
    } catch (error) {
      console.error('Erro ao carregar localização:', error);
    }
  };

  const getGoogleMapsUrl = () => {
    if (!motoboyLocation) return null;
    
    const origin = `${motoboyLocation.latitude},${motoboyLocation.longitude}`;
    const destination = encodeURIComponent(deliveryLocation);
    
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
  };

  const calculateETA = () => {
    // Simplified ETA calculation - in production use Google Distance Matrix API
    if (!motoboyLocation) return 'Calculando...';
    
    // Mock calculation
    return '15-20 minutos';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Rastreamento em Tempo Real
          </CardTitle>
          {isTracking && (
            <Badge variant="secondary" className="animate-pulse">
              <div className="h-2 w-2 bg-green-500 rounded-full mr-2" />
              Ao vivo
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Motoboy Info */}
        {motoboyInfo && (
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center text-white">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">{motoboyInfo.full_name}</p>
              <p className="text-sm text-muted-foreground">{motoboyInfo.phone}</p>
            </div>
          </div>
        )}

        {/* ETA */}
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium">Tempo Estimado:</span>
          </div>
          <span className="text-lg font-bold text-primary">{calculateETA()}</span>
        </div>

        {/* Map Preview */}
        <div className="h-64 bg-muted rounded-lg relative overflow-hidden">
          {motoboyLocation ? (
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyCXIKIKHpxzH8_qe_6ENkEY8ALepVkxoJA&origin=${motoboyLocation.latitude},${motoboyLocation.longitude}&destination=${encodeURIComponent(deliveryLocation)}&mode=driving`}
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Aguardando localização do motoboy...</p>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Coleta:</p>
              <p className="text-muted-foreground">{pickupLocation}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="font-medium">Entrega:</p>
              <p className="text-muted-foreground">{deliveryLocation}</p>
            </div>
          </div>
        </div>

        {/* Open in Google Maps */}
        {motoboyLocation && (
          <a
            href={getGoogleMapsUrl()!}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-3 bg-primary text-primary-foreground rounded-lg text-center font-medium hover:bg-primary/90 transition-colors"
          >
            Abrir no Google Maps
          </a>
        )}

        {/* Last Update */}
        {motoboyLocation && (
          <p className="text-xs text-center text-muted-foreground">
            Última atualização: {new Date(motoboyLocation.updated_at).toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
