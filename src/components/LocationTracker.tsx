import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Wifi, 
  WifiOff, 
  Clock, 
  Gauge,
  Compass
} from 'lucide-react';
import { useGeolocation } from '@/hooks/use-geolocation';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LocationTrackerProps {
  serviceId?: string;
  showControls?: boolean;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const LocationTracker = ({ 
  serviceId, 
  showControls = true,
  onLocationUpdate 
}: LocationTrackerProps) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const { position, error, getCurrentPosition, startWatching, stopWatching } = useGeolocation();
  
  // Usar useRef para armazenar o callback sem causar re-render
  const onLocationUpdateRef = useRef(onLocationUpdate);
  
  // Atualizar ref quando callback mudar
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);
  
  // Memoizar currentLocation para evitar recriação desnecessária
  const currentLocation = useMemo(() => {
    if (!position) return null;
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };
  }, [
    position?.coords.latitude,
    position?.coords.longitude,
    position?.coords.accuracy,
    position?.coords.speed,
    position?.coords.heading,
    position?.timestamp
  ]);

  // Notify parent component of location updates
  useEffect(() => {
    if (currentLocation && onLocationUpdateRef.current) {
      onLocationUpdateRef.current({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    }
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude
  ]);

  // Send location to Supabase for realtime tracking
  useEffect(() => {
    if (currentLocation && isAvailable) {
      updateLocationInSupabase(currentLocation);
    }
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,
    isAvailable
  ]);

  const updateLocationInSupabase = async (location: typeof currentLocation) => {
    if (!location) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase.rpc as any)('upsert_user_location', {
        p_user_id: user.id,
        p_latitude: location.latitude,
        p_longitude: location.longitude,
        p_accuracy: location.accuracy || null,
        p_speed: location.speed || null,
        p_heading: location.heading || null
      });
    } catch (error) {
      console.error('Erro ao atualizar localização no Supabase:', error);
    }
  };

  const handleToggleAvailability = () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    
    if (newStatus) {
      startWatching();
      toast.success('Você está online!');
    } else {
      stopWatching();
      toast.success('Você está offline');
    }
  };

  const handleGetCurrentLocation = () => {
    getCurrentPosition();
    toast.success('Atualizando localização...');
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A';
    return `${Math.round(speed * 3.6)} km/h`; // Convert m/s to km/h
  };

  const formatHeading = (heading?: number) => {
    if (!heading) return 'N/A';
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return `${Math.round(heading)}° ${directions[index]}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização
          </div>
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <Badge variant="default" className="bg-green-500">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Info */}
        {currentLocation && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <div className="font-mono">
                  {formatCoordinate(currentLocation.latitude)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <div className="font-mono">
                  {formatCoordinate(currentLocation.longitude)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground text-xs">Precisão</div>
                  <div className="font-medium">
                    {Math.round(currentLocation.accuracy)}m
                  </div>
                </div>
              </div>

              {currentLocation.speed !== undefined && (
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Velocidade</div>
                    <div className="font-medium">
                      {formatSpeed(currentLocation.speed)}
                    </div>
                  </div>
                </div>
              )}

              {currentLocation.heading !== undefined && (
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground text-xs">Direção</div>
                    <div className="font-medium">
                      {formatHeading(currentLocation.heading)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Atualizado recentemente
              </span>
            </div>
          </div>
        )}

        {/* No Location Message */}
        {!currentLocation && !error && (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma localização disponível</p>
            <p className="text-xs">Clique em "Obter Localização" para começar</p>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleToggleAvailability}
                variant={isAvailable ? "destructive" : "default"}
                className="w-full"
              >
                {isAvailable ? (
                  <>
                    <WifiOff className="h-4 w-4 mr-2" />
                    Ficar Offline
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Ficar Online
                  </>
                )}
              </Button>

              <Button
                onClick={handleGetCurrentLocation}
                variant="outline"
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            {/* Tracking Status */}
            <div className="text-center text-xs text-muted-foreground">
              {isAvailable ? (
                <span className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Rastreamento ativo
                </span>
              ) : (
                <span>Rastreamento inativo</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTracker;
