import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCapacitor } from '@/hooks/use-capacitor';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useCamera } from '@/hooks/use-camera';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useHaptics } from '@/hooks/use-haptics';
import { MapPin, Camera, Wifi, Smartphone, Vibrate, WifiOff } from 'lucide-react';

/**
 * Componente de demonstração das funcionalidades nativas
 * Use este componente para testar se tudo está funcionando
 */
export const NativeFeaturesDemo = () => {
  const { isNative, isAndroid, isIOS, platform } = useCapacitor();
  const { position, loading: gpsLoading, getCurrentPosition } = useGeolocation();
  const { photo, takePicture, pickFromGallery } = useCamera();
  const { connected, connectionType } = useNetworkStatus();
  const haptics = useHaptics();
  const [message, setMessage] = useState('');

  const handleGetLocation = async () => {
    try {
      haptics.light();
      setMessage('Obtendo localização...');
      const pos = await getCurrentPosition();
      setMessage(
        `✅ Localização obtida!\nLat: ${pos.coords.latitude.toFixed(6)}\nLng: ${pos.coords.longitude.toFixed(6)}`
      );
      haptics.success();
    } catch (error) {
      setMessage(`❌ Erro: ${(error as Error).message}`);
      haptics.error();
    }
  };

  const handleTakePicture = async () => {
    try {
      haptics.medium();
      setMessage('Abrindo câmera...');
      await takePicture();
      setMessage('✅ Foto tirada com sucesso!');
      haptics.success();
    } catch (error) {
      setMessage(`❌ Erro: ${(error as Error).message}`);
      haptics.error();
    }
  };

  const handlePickFromGallery = async () => {
    try {
      haptics.medium();
      setMessage('Abrindo galeria...');
      await pickFromGallery();
      setMessage('✅ Foto selecionada!');
      haptics.success();
    } catch (error) {
      setMessage(`❌ Erro: ${(error as Error).message}`);
      haptics.error();
    }
  };

  const testHaptics = async () => {
    await haptics.light();
    setTimeout(() => haptics.medium(), 200);
    setTimeout(() => haptics.heavy(), 400);
    setMessage('✅ Vibração testada!');
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
            Informações da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Plataforma:</span>
            <Badge variant={isNative ? 'default' : 'secondary'}>
              {platform.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Tipo:</span>
            <Badge variant={isNative ? 'default' : 'outline'}>
              {isNative ? 'App Nativo' : 'Web'}
            </Badge>
          </div>
          {isAndroid && <p className="text-sm text-green-600">✅ Rodando no Android</p>}
          {isIOS && <p className="text-sm text-blue-600">✅ Rodando no iOS</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geolocalização (GPS)
          </CardTitle>
          <CardDescription>Teste o acesso à localização do dispositivo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleGetLocation} disabled={gpsLoading} className="w-full">
            {gpsLoading ? 'Carregando...' : 'Obter Localização Atual'}
          </Button>
          {position && (
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p>
                <strong>Latitude:</strong> {position.coords.latitude.toFixed(6)}
              </p>
              <p>
                <strong>Longitude:</strong> {position.coords.longitude.toFixed(6)}
              </p>
              <p>
                <strong>Precisão:</strong> {position.coords.accuracy.toFixed(2)}m
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Câmera e Galeria
          </CardTitle>
          <CardDescription>Teste o acesso à câmera e galeria de fotos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button onClick={handleTakePicture} variant="default" className="flex-1">
              Tirar Foto
            </Button>
            <Button onClick={handlePickFromGallery} variant="outline" className="flex-1">
              Galeria
            </Button>
          </div>
          {photo && (
            <div className="space-y-2">
              <img
                src={photo.webPath}
                alt="Foto capturada"
                className="w-full h-48 object-cover rounded-lg"
              />
              <p className="text-sm text-muted-foreground">
                Formato: {photo.format} | Tamanho: {photo.webPath?.length} bytes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            Status da Rede
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Conectado:</span>
            <Badge variant={connected ? 'default' : 'destructive'}>
              {connected ? '✅ Online' : '❌ Offline'}
            </Badge>
          </div>
          {connected && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">Tipo:</span>
              <Badge variant="outline">{connectionType}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vibrate className="w-5 h-5" />
            Haptics (Vibração)
          </CardTitle>
          <CardDescription>
            {haptics.isAvailable ? 'Disponível' : 'Não disponível nesta plataforma'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={testHaptics}
            disabled={!haptics.isAvailable}
            variant="outline"
            className="w-full"
          >
            Testar Vibração (3 níveis)
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() => haptics.success()}
              disabled={!haptics.isAvailable}
              size="sm"
              variant="outline"
            >
              Sucesso
            </Button>
            <Button
              onClick={() => haptics.warning()}
              disabled={!haptics.isAvailable}
              size="sm"
              variant="outline"
            >
              Aviso
            </Button>
            <Button
              onClick={() => haptics.error()}
              disabled={!haptics.isAvailable}
              size="sm"
              variant="outline"
            >
              Erro
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <pre className="text-sm whitespace-pre-wrap">{message}</pre>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted">
        <CardHeader>
          <CardTitle className="text-sm">💡 Dica</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>
            Este componente está disponível para testar as funcionalidades nativas do app.
          </p>
          <p>
            <strong>Na web:</strong> Algumas funcionalidades podem não estar disponíveis ou
            funcionar de forma limitada.
          </p>
          <p>
            <strong>No app nativo:</strong> Todas as funcionalidades devem funcionar
            perfeitamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
