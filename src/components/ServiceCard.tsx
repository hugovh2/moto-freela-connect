import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Package, Navigation, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useServicePermissions } from "@/hooks/use-service-permissions";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description?: string;
    service_type: string;
    pickup_location: string;
    delivery_location: string;
    price: number;
    status: string;
  };
  onUpdate: () => void;
  isCompany?: boolean;
  isMotoboy?: boolean;
}

const ServiceCard = ({ service, onUpdate, isCompany, isMotoboy }: ServiceCardProps) => {
  const { canAcceptService, canUpdateService } = useServicePermissions();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "accepted":
        return "bg-blue-500";
      case "in_progress":
        return "bg-yellow-500";
      case "completed":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponível";
      case "accepted":
        return "Aceito";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const handleAcceptService = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Tentando aceitar serviço:', service.id, 'usuário:', user.id);

      const { error } = await supabase
        .from("services")
        .update({
          motoboy_id: user.id,
          status: "accepted",
        })
        .eq("id", service.id)
        .eq("status", "available"); // Only update if still available

      if (error) {
        console.error('Erro ao aceitar serviço:', error);
        throw error;
      }

      toast.success("Corrida aceita com sucesso!");
      onUpdate();
    } catch (error: any) {
      console.error('Erro completo:', error);
      toast.error(error.message || "Erro ao aceitar corrida");
    }
  };

  const handleCompleteService = async () => {
    try {
      const { error } = await supabase
        .from("services")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", service.id);

      if (error) throw error;

      toast.success("Corrida concluída!");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Erro ao concluir corrida");
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 animate-scale-in">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{service.title}</CardTitle>
          <Badge className={getStatusColor(service.status)}>
            {getStatusText(service.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {service.description && (
          <p className="text-sm text-muted-foreground">{service.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-primary" />
          <span>{service.service_type}</span>
        </div>
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
        <div className="flex items-center gap-2 text-lg font-bold text-primary">
          <DollarSign className="h-5 w-5" />
          <span>R$ {service.price.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {/* Navegação GPS */}
        {(isMotoboy || isCompany) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const destination = isMotoboy && service.status === 'accepted' 
                ? service.pickup_location 
                : service.delivery_location;
              window.open(`https://maps.google.com/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
            }}
          >
            <Navigation className="h-4 w-4 mr-1" />
            GPS
          </Button>
        )}
        
        {/* Detalhes Completos */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4 mr-1" />
              Detalhes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Corrida</DialogTitle>
              <DialogDescription>
                Status: {getStatusText(service.status)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Tipo:</p>
                <p className="text-muted-foreground">{service.service_type}</p>
              </div>
              <div>
                <p className="font-medium">De:</p>
                <p className="text-muted-foreground">{service.pickup_location}</p>
              </div>
              <div>
                <p className="font-medium">Para:</p>
                <p className="text-muted-foreground">{service.delivery_location}</p>
              </div>
              <div>
                <p className="font-medium">Valor:</p>
                <p className="text-lg font-bold text-primary">R$ {service.price.toFixed(2)}</p>
              </div>
              {service.description && (
                <div>
                  <p className="font-medium">Descrição:</p>
                  <p className="text-muted-foreground">{service.description}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Ação Rápida */}
        {isMotoboy && canAcceptService(service) && (
          <Button onClick={handleAcceptService} className="flex-1">
            Aceitar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;