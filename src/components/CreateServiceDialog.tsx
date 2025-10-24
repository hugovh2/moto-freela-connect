import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHaptics } from "@/hooks/use-haptics";
import { MapPin, Calculator } from "lucide-react";
import GoogleMap from "./GoogleMap";

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateServiceDialog = ({ open, onOpenChange, onSuccess }: CreateServiceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const haptics = useHaptics();
  
  const serviceTypes = [
    { value: "documentos", label: "Documentos" },
    { value: "encomendas", label: "Encomendas" },
    { value: "alimentos", label: "Alimentos" },
    { value: "medicamentos", label: "Medicamentos" },
    { value: "outros", label: "Outros" }
  ];

  const calculateDistance = (pickup: { lat: number; lng: number }, delivery: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in km
    const dLat = (delivery.lat - pickup.lat) * (Math.PI / 180);
    const dLng = (delivery.lng - pickup.lng) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pickup.lat * (Math.PI / 180)) * Math.cos(delivery.lat * (Math.PI / 180)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateEstimatedPrice = (distance: number, serviceType: string) => {
    const basePrices = {
      documentos: 8,
      encomendas: 12,
      alimentos: 15,
      medicamentos: 20,
      outros: 10
    };
    const basePrice = basePrices[serviceType as keyof typeof basePrices] || 10;
    return basePrice + (distance * 2.5); // R$ 2.50 per km
  };

  useEffect(() => {
    if (pickupCoords && deliveryCoords) {
      const dist = calculateDistance(pickupCoords, deliveryCoords);
      setDistance(dist);
    }
  }, [pickupCoords, deliveryCoords]);

  const handleServiceTypeChange = (serviceType: string) => {
    if (distance) {
      setEstimatedPrice(calculateEstimatedPrice(distance, serviceType));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const serviceData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      service_type: formData.get("service_type") as string,
      pickup_location: formData.get("pickup_location") as string,
      delivery_location: formData.get("delivery_location") as string,
      price: parseFloat(formData.get("price") as string),
      pickup_lat: pickupCoords?.lat,
      pickup_lng: pickupCoords?.lng,
      delivery_lat: deliveryCoords?.lat,
      delivery_lng: deliveryCoords?.lng,
      distance_km: distance,
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("services").insert([
        {
          ...serviceData,
          company_id: user.id,
        },
      ]);

      if (error) throw error;

      haptics.success();
      toast.success("Serviço criado com sucesso!");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar serviço");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Serviço</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do serviço de entrega
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Serviço</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: Entrega urgente de documentos"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Detalhes adicionais sobre a entrega..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">Tipo de Serviço</Label>
            <Select name="service_type" onValueChange={handleServiceTypeChange} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Selection with Map */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localizações
            </h4>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_location">Local de Retirada</Label>
                <Input
                  id="pickup_location"
                  name="pickup_location"
                  placeholder="Digite o endereço..."
                  required
                  className="mb-2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_location">Local de Entrega</Label>
                <Input
                  id="delivery_location"
                  name="delivery_location"
                  placeholder="Digite o endereço..."
                  required
                />
              </div>
            </div>

            {/* Map Preview */}
            <Card>
              <CardContent className="p-4">
                <GoogleMap
                  height="300px"
                  enableAddressSearch
                  showDirections={!!(pickupCoords && deliveryCoords)}
                  pickup={pickupCoords ? { ...pickupCoords } : undefined}
                  delivery={deliveryCoords ? { ...deliveryCoords } : undefined}
                  onAddressSelect={(address, coords) => {
                    // This is a simplified implementation
                    // In a real app, you'd need to determine if it's pickup or delivery
                    console.log('Address selected:', address, coords);
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Price Calculation */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Preço
            </h4>
            
            {distance && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Distância estimada: <strong>{distance.toFixed(1)} km</strong></p>
                    {estimatedPrice && (
                      <p>Preço sugerido: <strong>R$ {estimatedPrice.toFixed(2)}</strong></p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="price">Valor Oferecido (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="5"
                placeholder={estimatedPrice ? estimatedPrice.toFixed(2) : "0.00"}
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !pickupCoords || !deliveryCoords} 
              className="flex-1"
            >
              {isLoading ? "Criando..." : "Criar Serviço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateServiceDialog;