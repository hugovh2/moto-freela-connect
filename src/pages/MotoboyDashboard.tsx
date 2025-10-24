import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getUserProfile, signOut } from "@/lib/supabase-client";
import { safeNavigate } from "@/lib/navigation";
import { handleError } from "@/lib/error-handler";
import { checkLocationPermission, requestLocationPermissionWithFeedback, showSettingsGuide } from "@/lib/permissions-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  Package, 
  MapPin, 
  ToggleLeft, 
  ToggleRight, 
  Navigation,
  Bike,
  Star,
  DollarSign,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import ServiceCard from "@/components/ServiceCard";
import LocationTracker from "@/components/LocationTracker";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useHaptics } from "@/hooks/use-haptics";
import { useServiceNotifications } from "@/hooks/use-service-notifications";

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
  const [isAvailable, setIsAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [nearbyServices, setNearbyServices] = useState<Service[]>([]);
  const [currentUserLocation, setCurrentUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [motoboyProfile, setMotoboyProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    todayEarnings: 0,
    totalRides: 0,
    averageRating: 0,
    completionRate: 0
  });
  const [isMounted, setIsMounted] = useState(true);
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  
  const { position, getCurrentPosition, startWatching, stopWatching } = useGeolocation();
  const haptics = useHaptics();
  const { notifications } = useServiceNotifications('motoboy');

  useEffect(() => {
    initializeDashboard();
    
    return () => {
      setIsMounted(false);
      stopWatching();
    };
  }, []);

  /**
   * Initialize dashboard
   */
  const initializeDashboard = async () => {
    try {
      setIsLoading(true);
      
      // Check authentication
      const user = await getCurrentUser();
      
      if (!user) {
        if (isMounted) {
          safeNavigate(navigate, "/auth", { replace: true });
        }
        return;
      }

      // Get and validate profile
      const profile = await getUserProfile(user.id);

      if (!profile) {
        toast.error('Perfil não encontrado');
        if (isMounted) {
          safeNavigate(navigate, "/auth", { replace: true });
        }
        return;
      }

      if (profile.role !== "motoboy") {
        if (isMounted) {
          safeNavigate(navigate, "/company", { replace: true });
        }
        return;
      }
      
      if (isMounted) {
        setMotoboyProfile(profile);
        await calculateStats(user.id);
        await fetchServices();
      }
    } catch (error) {
      console.error('[MotoboyDashboard] Initialization error:', error);
      handleError(error, { customMessage: 'Erro ao inicializar dashboard' });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };


  const fetchServices = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        if (isMounted) {
          safeNavigate(navigate, "/auth", { replace: true });
        }
        return;
      }

      // Fetch available services
      const { data: available, error: availableError } = await supabase
        .from("services")
        .select("*")
        .eq("status", "available")
        .order("created_at", { ascending: false });

      if (availableError) {
        handleError(availableError, { customMessage: 'Erro ao carregar serviços disponíveis' });
      } else if (isMounted) {
        setAvailableServices(available || []);
      }

      // Fetch my accepted services
      const { data: mine, error: mineError } = await supabase
        .from("services")
        .select("*")
        .eq("motoboy_id", user.id)
        .in("status", ["accepted", "in_progress"])
        .order("created_at", { ascending: false });

      if (mineError) {
        handleError(mineError, { customMessage: 'Erro ao carregar suas corridas' });
      } else if (isMounted) {
        setMyServices(mine || []);
      }
    } catch (error: any) {
      console.error('[MotoboyDashboard] Fetch services error:', error);
      handleError(error, { customMessage: 'Erro ao carregar serviços' });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const success = await signOut();
      if (success && isMounted) {
        toast.success('Logout realizado com sucesso');
        safeNavigate(navigate, "/", { replace: true });
      }
    } catch (error) {
      console.error('[MotoboyDashboard] Sign out error:', error);
      handleError(error, { customMessage: 'Erro ao fazer logout' });
    }
  };

  const toggleAvailability = () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus);
    haptics.success();
    
    if (newStatus) {
      startWatching();
      toast.success("Você está online!");
    } else {
      stopWatching();
      toast.success("Você está offline.");
    }
  };

  // Update location state for map display
  const calculateStats = async (userId: string) => {
    try {
      const { data: allServices } = await supabase
        .from("services")
        .select("*")
        .eq("motoboy_id", userId);

      if (allServices) {
        const totalEarnings = allServices
          .filter(s => s.status === 'completed')
          .reduce((sum, s) => sum + (s.price || 0), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todayEarnings = allServices
          .filter(s => s.status === 'completed' && s.completed_at?.startsWith(today))
          .reduce((sum, s) => sum + (s.price || 0), 0);
        
        const totalRides = allServices.filter(s => s.status === 'completed').length;
        
        // TODO: Calculate average rating when rating fields are added to schema
        const averageRating = 0;
        
        const acceptedServices = allServices.filter(s => 
          ['accepted', 'in_progress', 'completed'].includes(s.status)
        ).length;
        const completionRate = acceptedServices > 0 
          ? (totalRides / acceptedServices) * 100 
          : 0;

        setStats({
          totalEarnings,
          todayEarnings,
          totalRides,
          averageRating,
          completionRate
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setCurrentUserLocation(location);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Bike className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
                    Painel do Motoboy
                  </h1>
                  {motoboyProfile && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Bem-vindo, {motoboyProfile.full_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quick Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">R$ {stats.todayEarnings.toFixed(2)} hoje</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={motoboyProfile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                    {motoboyProfile?.full_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" onClick={handleSignOut} className="text-slate-600 hover:text-slate-900">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ganhos Totais</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">R$ {stats.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">+R$ {stats.todayEarnings.toFixed(2)} hoje</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Corridas Totais</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.totalRides}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Bike className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {stats.completionRate.toFixed(0)}% concluídas
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Avaliação Média</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-3 w-3 ${
                        star <= Math.round(stats.averageRating) 
                          ? 'text-yellow-500 fill-yellow-500' 
                          : 'text-slate-300'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.completionRate.toFixed(0)}%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-purple-500" />
                  <span className="text-xs text-purple-600">Desempenho excelente</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Status and Controls */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Location Tracker */}
          <LocationTracker 
            onLocationUpdate={handleLocationUpdate}
            showControls={true}
          />

          {/* Quick Actions */}
          <Card className="border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Ações Rápidas</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Controle sua atividade
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={toggleAvailability}
                  className={`w-full justify-between ${
                    isAvailable 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                    {isAvailable ? "Ficar Offline" : "Ficar Online"}
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {isAvailable ? "Ativo" : "Inativo"}
                  </Badge>
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                    size="sm"
                    className="flex-1"
                  >
                    <Package className="h-4 w-4 mr-1" />
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'default' : 'outline'}
                    onClick={() => setViewMode('map')}
                    size="sm"
                    className="flex-1"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Mapa
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* My Services Section */}
        <section>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-gray-200/20 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Minhas Corridas Ativas</h2>
                <p className="text-slate-600 dark:text-slate-400">Gerencie suas entregas em andamento</p>
              </div>
              {myServices.length > 0 && (
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                  {myServices.length} ativa{myServices.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-gray-200/20 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Corridas Disponíveis</h2>
                <p className="text-slate-600 dark:text-slate-400">Encontre oportunidades próximas a você</p>
              </div>
              {availableServices.length > 0 && (
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">
                  {availableServices.length} disponível{availableServices.length !== 1 ? 'is' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          {isLoading ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg text-muted-foreground">Carregando corridas...</p>
              </CardContent>
            </Card>
          ) : availableServices.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  Nenhuma corrida disponível no momento
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {!isAvailable ? "Ative seu status para receber notificações de novas corridas" : "Aguarde novas corridas aparecerem"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {viewMode === 'map' ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="h-[500px] bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Mapa em desenvolvimento</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Nearby Services (Priority) */}
                  {nearbyServices.length > 0 && isAvailable && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Corridas Próximas a Você</h3>
                        <Badge className="bg-green-500">
                          {nearbyServices.length} próxima{nearbyServices.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nearbyServices.map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onUpdate={() => {
                              fetchServices();
                            }}
                            isMotoboy
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Available Services */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {nearbyServices.length > 0 ? 'Outras Corridas' : 'Todas as Corridas'}
                      </h3>
                      {availableServices.length > 0 && (
                        <Badge variant="secondary">
                          {availableServices.length} total
                        </Badge>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableServices
                        .filter(service => 
                          !nearbyServices.some(nearby => nearby.id === service.id)
                        )
                        .map((service) => (
                          <ServiceCard
                            key={service.id}
                            service={service}
                            onUpdate={fetchServices}
                            isMotoboy
                          />
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default MotoboyDashboard;