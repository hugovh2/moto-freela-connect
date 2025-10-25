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
      if (!user) {
        console.log('[LocationDebug] Usuário não autenticado');
        return;
      }

      console.log('[LocationDebug] Buscando localização para user:', user.id);

      // Tentar buscar sem .single() primeiro (mais permissivo)
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('[LocationDebug] Erro ao carregar:', error);
        
        // Erro 406 geralmente significa problema de RLS ou tabela não existe
        if (error.code === '406' || error.message.includes('406')) {
          console.error('[LocationDebug] ⚠️ Erro 406: Tabela pode não existir ou RLS bloqueando');
          console.error('[LocationDebug] Execute: supabase/FIX_REALTIME.sql');
        }
        
        // PGRST116 = não encontrou registro (ok, ainda não enviou)
        if (error.code !== 'PGRST116') {
          toast.error('Erro ao carregar localização. Veja o console.');
        }
        return;
      }

      if (data && data.length > 0) {
        console.log('[LocationDebug] ✅ Localização encontrada:', data[0]);
        setMyLocation(data[0]);
        setLastUpdate(new Date(data[0].updated_at).toLocaleTimeString('pt-BR'));
      } else {
        console.log('[LocationDebug] Nenhuma localização salva ainda');
      }
    } catch (error: any) {
      console.error('[LocationDebug] Erro catch:', error);
      toast.error(`Erro: ${error.message}`);
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
            console.log('[LocationDebug] Tentando enviar localização completa...');
            
            // Tentar com todas as colunas primeiro
            let { error } = await (supabase.rpc as any)('upsert_user_location', {
              p_user_id: user.id,
              p_latitude: position.coords.latitude,
              p_longitude: position.coords.longitude,
              p_accuracy: position.coords.accuracy,
              p_speed: position.coords.speed,
              p_heading: position.coords.heading
            });

            // Se erro 42703 (coluna não existe), tentar insert direto sem colunas opcionais
            if (error && error.code === '42703') {
              console.warn('[LocationDebug] ⚠️ Colunas opcionais não existem, tentando apenas lat/lng...');
              console.warn('[LocationDebug] Execute: supabase/FIX_COLUNAS_FALTANTES.sql');
              
              // Fallback: insert direto com apenas lat/lng
              const { error: insertError } = await supabase
                .from('user_locations')
                .upsert({
                  user_id: user.id,
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  updated_at: new Date().toISOString()
                }, {
                  onConflict: 'user_id'
                });
              
              error = insertError;
            }

            if (error) {
              console.error('[LocationDebug] Erro final:', error);
              toast.error(`Erro ao enviar: ${error.message}`);
            } else {
              console.log('[LocationDebug] ✅ Localização enviada com sucesso!');
              toast.success('Localização enviada!');
              loadMyLocation();
            }
          } catch (error: any) {
            console.error('[LocationDebug] Erro catch:', error);
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
