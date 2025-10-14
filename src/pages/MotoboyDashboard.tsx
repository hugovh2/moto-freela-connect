import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, Package } from "lucide-react";
import { toast } from "sonner";
import ServiceCard from "@/components/ServiceCard";

interface Service {
  id: string;
  title: string;
  description: string;
  service_type: string;
  pickup_location: string;
  delivery_location: string;
  price: number;
  status: string;
  created_at: string;
}

const MotoboyDashboard = () => {
  const navigate = useNavigate();
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    fetchServices();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "motoboy") {
      navigate("/company");
    }
  };

  const fetchServices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch available services
      const { data: available, error: availableError } = await supabase
        .from("services")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;
      setAvailableServices(available || []);

      // Fetch my accepted services
      const { data: mine, error: mineError } = await supabase
        .from("services")
        .select("*")
        .eq("motoboy_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (mineError) throw mineError;
      setMyServices(mine || []);
    } catch (error: any) {
      toast.error("Erro ao carregar serviços");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Painel do Motoboy</h1>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* My Services Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Minhas Corridas</h2>
          {myServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Você ainda não aceitou nenhuma corrida
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onUpdate={fetchServices}
                  isMotoboy
                />
              ))}
            </div>
          )}
        </section>

        {/* Available Services Section */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Corridas Disponíveis</h2>
          {isLoading ? (
            <div className="text-center py-12">Carregando...</div>
          ) : availableServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Nenhuma corrida disponível no momento
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onUpdate={fetchServices}
                  isMotoboy
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default MotoboyDashboard;