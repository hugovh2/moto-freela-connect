import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getUserProfile, getUserRole, signOut } from "@/lib/supabase-client";
import { safeNavigate } from "@/lib/navigation";
import { handleError } from "@/lib/error-handler";
import { checkLocationPermission, requestLocationPermissionWithFeedback, showSettingsGuide } from "@/lib/permissions-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
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
import { ActiveRideCard } from "@/components/ActiveRideCard";
import { ChatWindow } from "@/components/ChatWindow";
import { ServiceFilters, FilterCriteria } from "@/components/ServiceFilters";
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
  accepted_at?: string;
  company_id: string;
  motoboy_id: string;
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
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [filters, setFilters] = useState<FilterCriteria | null>(null);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  const { position, getCurrentPosition, startWatching, stopWatching } = useGeolocation();
  const haptics = useHaptics();
  const { notifications } = useServiceNotifications('motoboy');

  // Initialize message notifications
  useMessageNotifications({
    userId: motoboyProfile?.id || '',
    onNewMessage: (message) => {
      console.log('[MotoboyDashboard] Nova mensagem recebida:', message);
      haptics.medium(); // Vibração média
    }
  });

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
      console.log('[MotoboyDashboard] Inicializando dashboard...');
      
      // Check authentication
      const user = await getCurrentUser();
      
      if (!user) {
        console.log('[MotoboyDashboard] Usuário não autenticado');
        if (isMounted) {
          safeNavigate(navigate, "/auth", { replace: true });
        }
        return;
      }

      console.log('[MotoboyDashboard] Usuário encontrado:', user.id);

      // Get and validate profile com timeout
      const profilePromise = getUserProfile(user.id);
      const rolePromise = getUserRole(user.id);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 8000)
      );

      let profile, role;
      try {
        [profile, role] = await Promise.race([
          Promise.all([profilePromise, rolePromise]),
          timeoutPromise
        ]);
      } catch (timeoutError) {
        console.error('[MotoboyDashboard] Timeout ao carregar dados:', timeoutError);
        // Em caso de timeout, tenta continuar com valores padrão
        profile = null;
        role = 'motoboy';
      }

      console.log('[MotoboyDashboard] Profile:', profile, 'Role:', role);

      if (!profile || !role) {
        console.warn('[MotoboyDashboard] Perfil ou role não encontrado');
        toast.error('Erro ao carregar perfil. Usando dados padrão.');
        // Não redireciona, apenas continua com dados limitados
      }

      if (role && role !== "motoboy") {
        console.log('[MotoboyDashboard] Usuário não é motoboy, redirecionando...');
        if (isMounted) {
          safeNavigate(navigate, "/company", { replace: true });
        }
        return;
      }
      
      if (isMounted) {
        if (profile) {
          setMotoboyProfile(profile);
        }
        
        try {
          await calculateStats(user.id);
        } catch (statsError) {
          console.error('[MotoboyDashboard] Erro ao calcular stats:', statsError);
          // Não bloqueia se stats falharem
        }
        
        try {
          await fetchServices();
        } catch (servicesError) {
          console.error('[MotoboyDashboard] Erro ao buscar serviços:', servicesError);
          // Não bloqueia se fetch de serviços falhar
        }
      }
    } catch (error) {
      console.error('[MotoboyDashboard] Initialization error:', error);
      handleError(error, { 
        customMessage: 'Erro ao inicializar dashboard',
        silent: true
      });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };


  const fetchServices = useCallback(async () => {
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

      // Fetch my accepted services (incluindo todos os status ativos)
      const { data: mine, error: mineError } = await supabase
        .from("services")
        .select("*")
        .eq("motoboy_id", user.id)
        .in("status", ["accepted", "collected", "on_route", "in_progress"] as any)
        .order("created_at", { ascending: false });

      if (mineError) {
        handleError(mineError, { customMessage: 'Erro ao carregar suas corridas' });
      } else if (isMounted) {
        setMyServices(mine || []);
      }

      // Configurar real-time subscription para atualizar cards automaticamente
      const channel = supabase
        .channel('motoboy-services')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'services'
          },
          (payload) => {
            console.log('[MotoboyDashboard] Real-time update:', payload);
            // Recarregar serviços quando houver mudança
            fetchServices();
          }
        )
        .subscribe();

      // Cleanup na desmontagem (será chamado pelo useEffect)
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error('[MotoboyDashboard] Fetch services error:', error);
      handleError(error, { customMessage: 'Erro ao carregar serviços' });
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, [isMounted, navigate]);

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
          .filter(s => s.status === 'completed' || (s.status as any) === 'delivered')
          .reduce((sum, s) => sum + (s.price || 0), 0);
        
        const today = new Date().toISOString().split('T')[0];
        const todayEarnings = allServices
          .filter(s => (s.status === 'completed' || (s.status as any) === 'delivered') && (s.completed_at?.startsWith(today) || s.updated_at?.startsWith(today)))
          .reduce((sum, s) => sum + (s.price || 0), 0);
        
        const totalRides = allServices.filter(s => s.status === 'completed' || (s.status as any) === 'delivered').length;
        
        // TODO: Calculate average rating when rating fields are added to schema
        const averageRating = 0;
        
        const acceptedServices = allServices.filter(s => 
          ['accepted', 'collected', 'on_route', 'in_progress', 'completed', 'delivered'].includes(s.status)
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

  const handleLocationUpdate = useCallback((location: { lat: number; lng: number }) => {
    setCurrentUserLocation(location);
  }, []);

  const applyFilters = useCallback((criteria: FilterCriteria) => {
    setFilters(criteria);
    let filtered = [...availableServices];
    if (criteria.minPrice) {
      filtered = filtered.filter(s => s.price >= criteria.minPrice!);
    }
    if (criteria.serviceTypes && criteria.serviceTypes.length > 0) {
      filtered = filtered.filter(s => criteria.serviceTypes!.includes(s.service_type));
    }
    setFilteredServices(filtered);
    toast.success(`${filtered.length} corrida(s) encontrada(s)`);
  }, [availableServices]);

  const resetFilters = useCallback(() => {
    setFilters(null);
    setFilteredServices([]);
    toast.info('Filtros removidos');
  }, []);

  const displayServices = filters ? filteredServices : availableServices;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 dark:from-slate-900 dark:to-slate-800">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bike className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300 truncate">
                    Painel do Motoboy
                  </h1>
                  {motoboyProfile && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                      {motoboyProfile.full_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">R$ {stats.todayEarnings.toFixed(2)} hoje</span>
                </div>
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full">
                  <Star className="h-4 w-4" />
                  <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {motoboyProfile && (
                  <ProfilePhotoUpload
                    currentPhotoUrl={motoboyProfile.avatar_url}
                    userName={motoboyProfile.full_name || 'Motoboy'}
                    userId={motoboyProfile.id}
                    onPhotoUpdated={(newUrl) => {
                      setMotoboyProfile({ ...motoboyProfile, avatar_url: newUrl });
                    }}
                  />
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-600 hover:text-slate-900 h-8 w-8 sm:h-10 sm:w-10 p-0">
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Ganhos Totais</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">R$ {stats.totalEarnings.toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-2 hidden sm:flex">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">+R$ {stats.todayEarnings.toFixed(2)} hoje</span>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Corridas Totais</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.totalRides}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bike className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 hidden sm:block">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {stats.completionRate.toFixed(0)}% concluídas
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-yellow-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Avaliação Média</p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.averageRating.toFixed(1)}</p>
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 hidden sm:block">
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
        <section className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {/* Location Tracker */}
          <LocationTracker 
            onLocationUpdate={handleLocationUpdate}
            showControls={true}
            isAvailable={isAvailable}
          />

          {/* Histórico de Corridas */}
          <Card className="border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Histórico de Corridas</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {myServices.filter(s => s.status === 'delivered').length > 0 ? (
                  myServices
                    .filter(s => s.status === 'delivered')
                    .slice(0, 5)
                    .map(service => (
                      <div key={service.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{service.title}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {service.pickup_location}
                            </p>
                          </div>
                          <div className="text-right ml-2 flex-shrink-0">
                            <p className="text-sm font-bold text-green-600">R$ {service.price.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.created_at ? new Date(service.created_at).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Nenhuma corrida concluída ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick Actions */}
        <section className="grid md:grid-cols-2 gap-6">
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

          {/* Stats Quick View */}
          <Card className="border-0 bg-white dark:bg-slate-900">
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Status Hoje</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalRides}</p>
                    <p className="text-xs text-muted-foreground">Corridas</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.completionRate}%</p>
                    <p className="text-xs text-muted-foreground">Conclusão</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avaliação</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{myServices.length}</p>
                    <p className="text-xs text-muted-foreground">Ativas</p>
                  </div>
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
            <div className="space-y-6">
              {myServices.map((service) => (
                <ActiveRideCard
                  key={service.id}
                  service={service}
                  isMotoboy={true}
                  onUpdate={fetchServices}
                  onOpenChat={() => {
                    setSelectedService(service);
                    setChatOpen(true);
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Chat Window */}
          {chatOpen && selectedService && (
            <ChatWindow
              serviceId={selectedService.id}
              receiverId={selectedService.company_id}
              receiverName="Empresa"
              onClose={() => setChatOpen(false)}
              minimized={false}
              onToggleMinimize={() => {}}
            />
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
                    <div className="h-[500px] bg-muted rounded-lg overflow-auto">
                      <div className="space-y-4 p-4">
                        <h3 className="text-lg font-semibold mb-4">📍 Serviços Disponíveis no Mapa</h3>
                        {availableServices.length === 0 ? (
                          <div className="flex items-center justify-center h-64">
                            <p className="text-muted-foreground">Nenhum serviço disponível no momento</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {availableServices.map((service) => (
                              <div key={service.id} className="border rounded-lg p-4 hover:bg-accent transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold">{service.title}</h4>
                                  <Badge className="bg-green-500">R$ {service.price.toFixed(2)}</Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                                    <div>
                                      <p className="font-medium">De:</p>
                                      <p className="text-muted-foreground">{service.pickup_location}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-destructive mt-0.5" />
                                    <div>
                                      <p className="font-medium">Para:</p>
                                      <p className="text-muted-foreground">{service.delivery_location}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                  <Button 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={async () => {
                                      const card = document.querySelector(`[data-service-id="${service.id}"]`);
                                      if (card) {
                                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                      }
                                    }}
                                  >
                                    Ver Detalhes
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(service.pickup_location)}`, '_blank');
                                    }}
                                  >
                                    <Navigation className="h-4 w-4 mr-1" />
                                    GPS
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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