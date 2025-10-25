import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const LocationDebug = () => {
  const [myLocation, setMyLocation] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('Nunca');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMyLocation();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadMyLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMyLocation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar localização:', error);
      } else if (data) {
        setMyLocation(data);
        setLastUpdate(new Date(data.updated_at).toLocaleTimeString('pt-BR'));
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const testSendLocation = async () => {
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Pegar localização atual do navegador
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { error } = await (supabase.rpc as any)('upsert_user_location', {
              p_user_id: user.id,
              p_latitude: position.coords.latitude,
              p_longitude: position.coords.longitude,
              p_accuracy: position.coords.accuracy,
              p_speed: position.coords.speed,
              p_heading: position.coords.heading
            });

            if (error) {
              console.error('Erro RPC:', error);
              toast.error(`Erro ao enviar: ${error.message}`);
            } else {
              toast.success('Localização enviada!');
              loadMyLocation();
            }
          } catch (error: any) {
            console.error('Erro ao enviar:', error);
            toast.error(`Erro: ${error.message}`);
          }
        },
        (error) => {
          toast.error(`Erro GPS: ${error.message}`);
        }
      );
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Debug - Localização
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMyLocation}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {myLocation ? (
          <>
            <Badge variant="secondary">✅ Localização Salva no Supabase</Badge>
            <div className="space-y-2 text-sm">
              <p><strong>Latitude:</strong> {myLocation.latitude}</p>
              <p><strong>Longitude:</strong> {myLocation.longitude}</p>
              <p><strong>Precisão:</strong> {myLocation.accuracy}m</p>
              <p><strong>Última atualização:</strong> {lastUpdate}</p>
            </div>
          </>
        ) : (
          <Badge variant="destructive">❌ Nenhuma localização salva</Badge>
        )}

        <Button
          className="w-full"
          onClick={testSendLocation}
          disabled={isSending}
        >
          {isSending ? 'Enviando...' : 'Testar Enviar Localização Agora'}
        </Button>
      </CardContent>
    </Card>
  );
};
