import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";
import { useGeolocation } from "@/hooks/use-geolocation";
import { MapPin, DollarSign, Clock, Navigation2, Package, Loader2 } from "lucide-react";

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateServiceDialogModern = ({ open, onOpenChange, onSuccess }: CreateServiceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [customPrice, setCustomPrice] = useState<string>("");
  const [distance, setDistance] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState("encomendas");
  const [isGeocodingPickup, setIsGeocodingPickup] = useState(false);
  const [isGeocodingDelivery, setIsGeocodingDelivery] = useState(false);
  
  const haptics = useHaptics();
  const { getCurrentPosition } = useGeolocation();
  
  const serviceTypes = [
    { value: "documentos", label: "📄 Documentos", basePrice: 8, icon: "📄" },
    { value: "encomendas", label: "📦 Encomendas", basePrice: 12, icon: "📦" },
    { value: "alimentos", label: "🍔 Alimentos", basePrice: 15, icon: "🍔" },
    { value: "medicamentos", label: "💊 Medicamentos", basePrice: 20, icon: "💊" },
    { value: "outros", label: "📌 Outros", basePrice: 10, icon: "📌" }
  ];

  // Geocoding: Converte endereço em coordenadas
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=AIzaSyCXIKIKHpxzH8_qe_6ENkEY8ALepVkxoJA`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }
      return null;
    } catch (error) {
      console.error('Erro no geocoding:', error);
      return null;
    }
  };

  // Buscar coordenadas quando endereço de coleta mudar
  useEffect(() => {
    if (!pickupAddress || pickupAddress.length < 10) return;
    
    const timer = setTimeout(async () => {
      setIsGeocodingPickup(true);
      const coords = await geocodeAddress(pickupAddress);
      if (coords) {
        setPickupCoords(coords);
        toast.success("📍 Endereço de coleta localizado!");
        haptics.light();
      }
      setIsGeocodingPickup(false);
    }, 1500); // Aguarda 1.5s após parar de digitar
    
    return () => clearTimeout(timer);
  }, [pickupAddress]);

  // Buscar coordenadas quando endereço de entrega mudar
  useEffect(() => {
    if (!deliveryAddress || deliveryAddress.length < 10) return;
    
    const timer = setTimeout(async () => {
      setIsGeocodingDelivery(true);
      const coords = await geocodeAddress(deliveryAddress);
      if (coords) {
        setDeliveryCoords(coords);
        toast.success("📍 Endereço de entrega localizado!");
        haptics.light();
      }
      setIsGeocodingDelivery(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [deliveryAddress]);

  // Calcular distância e preço quando ambas coordenadas estiverem disponíveis
  useEffect(() => {
    if (!pickupCoords || !deliveryCoords) {
      setDistance(null);
      setEstimatedPrice(null);
      setEstimatedTime(null);
      return;
    }

    // Calcular distância usando Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = (deliveryCoords.lat - pickupCoords.lat) * (Math.PI / 180);
    const dLng = (deliveryCoords.lng - pickupCoords.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pickupCoords.lat * (Math.PI / 180)) * Math.cos(deliveryCoords.lat * (Math.PI / 180)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;

    setDistance(dist);

    // Calcular preço
    const selectedType = serviceTypes.find(t => t.value === serviceType);
    const basePrice = selectedType?.basePrice || 10;
    const price = basePrice + (dist * 2.5); // R$ 2.50 por km
    setEstimatedPrice(price);

    // Calcular tempo (assumindo 30 km/h)
    const time = Math.round((dist / 30) * 60);
    setEstimatedTime(time);

  }, [pickupCoords, deliveryCoords, serviceType]);

  // Usar localização atual para coleta
  const handleUseCurrentLocation = async () => {
    try {
      toast.loading("📍 Obtendo sua localização...");
      const position = await getCurrentPosition();
      
      if (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setPickupCoords({ lat, lng });
        
        // Reverse geocoding para obter endereço
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyCXIKIKHpxzH8_qe_6ENkEY8ALepVkxoJA`
        );
        const data = await response.json();
        
        if (data.results && data.results[0]) {
          setPickupAddress(data.results[0].formatted_address);
        }
        
        toast.dismiss();
        toast.success("✅ Localização atual definida!");
        haptics.success();
      }
    } catch (error) {
      toast.dismiss();
      toast.error("❌ Erro ao obter localização");
      console.error("Geolocation error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!pickupCoords || !deliveryCoords) {
      toast.error("⚠️ Aguarde a localização dos endereços");
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const finalPrice = customPrice ? parseFloat(customPrice) : (estimatedPrice || 0);
    
    const serviceData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      service_type: serviceType,
      pickup_location: pickupAddress,
      delivery_location: deliveryAddress,
      price: finalPrice,
      pickup_lat: pickupCoords.lat,
      pickup_lng: pickupCoords.lng,
      delivery_lat: deliveryCoords.lat,
      delivery_lng: deliveryCoords.lng,
      distance_km: distance,
      estimated_time_minutes: estimatedTime,
    };

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Você precisa fazer login');
        return;
      }

      const { error } = await supabase.from("services").insert([
        {
          ...serviceData,
          company_id: user.id,
        },
      ]);

      if (error) throw error;

      haptics.success();
      toast.success("✅ Entrega criada com sucesso!");
      onSuccess();
      onOpenChange(false);

      // Limpar formulário
      setPickupAddress("");
      setDeliveryAddress("");
      setPickupCoords(null);
      setDeliveryCoords(null);
      setDistance(null);
      setEstimatedPrice(null);
    } catch (error: any) {
      console.error('Erro ao criar serviço:', error);
      toast.error(error.message || 'Erro ao criar serviço');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Nova Entrega
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da entrega. Os endereços serão localizados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
          {/* Título e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Entrega</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Entrega de Documento Urgente"
                required
                className="h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">Tipo de Serviço</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Endereço de Coleta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pickup" className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                Endereço de Coleta
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUseCurrentLocation}
                className="text-xs"
              >
                <Navigation2 className="h-3 w-3 mr-1" />
                Usar minha localização
              </Button>
            </div>
            <div className="relative">
              <Input
                id="pickup"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                required
                className="h-12 pr-10"
              />
              {isGeocodingPickup && (
                <Loader2 className="absolute right-3 top-3 h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
            {pickupCoords && (
              <Badge variant="secondary" className="text-xs">
                ✅ Localizado
              </Badge>
            )}
          </div>

          {/* Endereço de Entrega */}
          <div className="space-y-2">
            <Label htmlFor="delivery" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-600" />
              Endereço de Entrega
            </Label>
            <div className="relative">
              <Input
                id="delivery"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Rua Augusta, 500 - Consolação, São Paulo - SP"
                required
                className="h-12 pr-10"
              />
              {isGeocodingDelivery && (
                <Loader2 className="absolute right-3 top-3 h-6 w-6 animate-spin text-muted-foreground" />
              )}
            </div>
            {deliveryCoords && (
              <Badge variant="secondary" className="text-xs">
                ✅ Localizado
              </Badge>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Detalhes Adicionais (opcional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Ex: Documento importante, requer assinatura..."
              rows={3}
            />
          </div>

          {/* Preview de Cálculos */}
          {distance && estimatedPrice && estimatedTime && (
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-950/20 dark:to-pink-950/20">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Resumo da Entrega</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600 mb-1" />
                    <span className="text-xs text-muted-foreground">Distância</span>
                    <span className="text-lg font-bold">{distance.toFixed(1)} km</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600 mb-1" />
                    <span className="text-xs text-muted-foreground">Tempo Est.</span>
                    <span className="text-lg font-bold">{estimatedTime} min</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-white dark:bg-slate-900 rounded-lg">
                    <DollarSign className="h-5 w-5 text-orange-600 mb-1" />
                    <span className="text-xs text-muted-foreground">Valor Sugerido</span>
                    <span className="text-lg font-bold">R$ {estimatedPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campo de Preço Customizado */}
          <div className="space-y-2">
            <Label htmlFor="custom_price" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-orange-600" />
              Valor da Entrega (Você define)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground">R$</span>
              <Input
                id="custom_price"
                type="number"
                step="0.01"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder={estimatedPrice ? estimatedPrice.toFixed(2) : "0.00"}
                className="h-10 sm:h-12 pl-8 sm:pl-10 text-base sm:text-lg font-semibold"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {customPrice 
                ? `💰 Valor definido: R$ ${parseFloat(customPrice).toFixed(2)}` 
                : estimatedPrice 
                ? `💡 Sugestão: R$ ${estimatedPrice.toFixed(2)} (baseado em ${distance?.toFixed(1)} km)`
                : "Digite o valor que deseja pagar pela entrega"
              }
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
              disabled={isLoading || !pickupCoords || !deliveryCoords}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Criar Entrega
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServiceDialogModern;
