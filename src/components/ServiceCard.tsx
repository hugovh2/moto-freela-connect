import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

      const { error } = await supabase
        .from("services")
        .update({
          motoboy_id: user.id,
          status: "accepted",
        })
        .eq("id", service.id);

      if (error) throw error;

      toast.success("Corrida aceita com sucesso!");
      onUpdate();
    } catch (error: any) {
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
      {isMotoboy && service.status === "available" && (
        <CardFooter>
          <Button onClick={handleAcceptService} className="w-full">
            Aceitar Corrida
          </Button>
        </CardFooter>
      )}
      {isMotoboy && service.status === "accepted" && (
        <CardFooter>
          <Button onClick={handleCompleteService} className="w-full">
            Marcar como Concluída
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ServiceCard;