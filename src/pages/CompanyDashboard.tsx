import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, getUserProfile, getUserRole, signOut } from "@/lib/supabase-client";
import { safeNavigate } from "@/lib/navigation";
import { handleError } from "@/lib/error-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { 
  Plus, 
  LogOut, 
  Package, 
  Navigation, 
  BarChart3,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  Users,
  MapPin,
  Activity,
  Calendar,
  Filter,
  Search,
  Bell
} from "lucide-react";
import { toast } from "sonner";
import CreateServiceDialogModern from "@/components/CreateServiceDialogModern";
import ServiceCard from "@/components/ServiceCard";
import { ActiveRideCard } from "@/components/ActiveRideCard";
import { LiveTracking } from "@/components/LiveTracking";
import { ChatWindow } from "@/components/ChatWindow";
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
  company_id: string;
  motoboy_id?: string;
}

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showTracking, setShowTracking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [stats, setStats] = useState({
    totalServices: 0,
    activeServices: 0,
    completedServices: 0,
    totalSpent: 0,
    averageRating: 0
  });
  const [isMounted, setIsMounted] = useState(true);
  
  // Initialize notifications for company
  const { notifications } = useServiceNotifications('company');

  // Initialize message notifications
  useMessageNotifications({
    userId: companyProfile?.id || '',
    onNewMessage: (message) => {
      console.log('[CompanyDashboard] Nova mensagem recebida:', message);
      // Aqui você pode adicionar lógica adicional, como atualizar contador de mensagens
    }
  });

  useEffect(() => {
    const init = async () => {
      try {
        await checkAuth();
        await fetchServices();
      } catch (error) {
        console.error('[CompanyDashboard] Init error:', error);
      }
    };
    
    init();
    
    return () => {
      setIsMounted(false);
    };
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[CompanyDashboard] Verificando autenticação...');
      
      const user = await getCurrentUser();
      
      if (!user) {
        console.log('[CompanyDashboard] Usuário não autenticado');
        if (isMounted) {
          safeNavigate(navigate, "/auth", { replace: true });
        }
        return;
      }

      console.log('[CompanyDashboard] Usuário encontrado:', user.id);

      // Timeout de 8s para buscar perfil e role
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
        console.error('[CompanyDashboard] Timeout ao carregar dados:', timeoutError);
        // Em caso de timeout, tenta continuar com valores padrão
        profile = null;
        role = 'company';
      }

      console.log('[CompanyDashboard] Profile:', profile, 'Role:', role);

      if (!profile || !role) {
        console.warn('[CompanyDashboard] Perfil ou role não encontrado');
        toast.error('Erro ao carregar perfil. Usando dados padrão.');
        // Não redireciona, apenas continua com dados limitados
      }

      if (role && role !== "company") {
        console.log('[CompanyDashboard] Usuário não é empresa, redirecionando...');
        if (isMounted) {
          safeNavigate(navigate, "/motoboy", { replace: true });
        }
        return;
      }
      
      if (isMounted && profile) {
        setCompanyProfile(profile);
        try {
          await calculateStats(user.id);
        } catch (statsError) {
          console.error('[CompanyDashboard] Erro ao calcular stats:', statsError);
          // Não bloqueia se stats falharem
        }
      }
    } catch (error) {
      console.error('[CompanyDashboard] Auth check error:', error);
      handleError(error, { 
        customMessage: 'Erro ao verificar autenticação',
        silent: true 
      });
      // Não redireciona automaticamente para evitar loop
    }
  };

  const calculateStats = async (userId: string) => {
    try {
      const { data: allServices } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", userId);

      if (allServices) {
        const totalServices = allServices.length;
        const activeServices = allServices.filter(s => 
          ['available', 'accepted', 'collected', 'on_route', 'in_progress'].includes(s.status) || 
          (s.status as any) === 'collected' || 
          (s.status as any) === 'on_route'
        ).length;
        const completedServices = allServices.filter(s => 
          s.status === 'completed' || (s.status as any) === 'delivered'
        ).length;
        const totalSpent = allServices.reduce((sum, s) => sum + (s.price || 0), 0);
        
        // TODO: Calculate average rating when rating fields are added to schema
        const averageRating = 0;

        setStats({
          totalServices,
          activeServices,
          completedServices,
          totalSpent,
          averageRating
        });
      }
    } catch (error) {
      console.error('Error calculating stats:', error);
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

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("company_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        handleError(error, { customMessage: 'Erro ao carregar serviços' });
        return;
      }
      
      if (isMounted) {
        setServices(data || []);
      }

      // Configurar real-time subscription para atualizar cards automaticamente
      const channel = supabase
        .channel('company-services')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'services',
            filter: `company_id=eq.${user.id}`
          },
          (payload) => {
            console.log('[CompanyDashboard] Real-time update:', payload);
            // Recarregar serviços quando houver mudança
            fetchServices();
          }
        )
        .subscribe();

      // Cleanup na desmontagem
      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error: any) {
      console.error('[CompanyDashboard] Fetch services error:', error);
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
      console.error('[CompanyDashboard] Sign out error:', error);
      handleError(error, { customMessage: 'Erro ao fazer logout' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/20 sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300 truncate">
                    Painel da Empresa
                  </h1>
                  {companyProfile && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 truncate">
                      {companyProfile.full_name}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Button
                onClick={() => setShowCreateDialog(true)}
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 h-8 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Nova Entrega</span>
              </Button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {companyProfile && (
                  <ProfilePhotoUpload
                    currentPhotoUrl={companyProfile.avatar_url}
                    userName={companyProfile.full_name || 'Empresa'}
                    userId={companyProfile.id}
                    onPhotoUpdated={(newUrl) => {
                      setCompanyProfile({ ...companyProfile, avatar_url: newUrl });
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
          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Total de Entregas</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.totalServices}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-2 hidden sm:flex">
                <Badge variant="outline" className="text-xs">
                  +12% este mês
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Entregas Ativas</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{stats.activeServices}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Em andamento</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="p-3 sm:p-4 md:p-6">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 truncate">Total Investido</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white truncate">R$ {stats.totalSpent.toFixed(2)}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 md:mt-4 flex items-center gap-2 hidden sm:flex">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">↗ Economia de 15%</span>
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
        </section>

        {/* Action Bar */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg border border-gray-200/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gerenciar Entregas</h2>
              <p className="text-slate-600 dark:text-slate-400">Acompanhe e gerencie todas as suas entregas em tempo real</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="text-xs"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className="text-xs"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Mapa
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Services Content */}
        <section>
          {isLoading ? (
            <Card className="border-0 bg-white dark:bg-slate-900">
              <CardContent className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Carregando suas entregas...</p>
              </CardContent>
            </Card>
          ) : services.length === 0 ? (
            <Card className="border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 text-center">
              <CardContent className="p-16">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  Primeira entrega?
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                  Comece agora mesmo! Crie sua primeira entrega e conecte-se com motoboys próximos.
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeira Entrega
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {services.map((service) => (
                <div key={service.id} className="space-y-4">
                  {/* ActiveRideCard para serviços ativos (aceitos pelo motoboy) */}
                  {service.motoboy_id && (
                    ['accepted', 'collected', 'on_route', 'in_progress', 'delivered', 'completed'].includes(service.status) || 
                    (service.status as any) === 'collected' || 
                    (service.status as any) === 'on_route'
                  ) ? (
                    <ActiveRideCard
                      service={service}
                      isMotoboy={false}
                      onUpdate={fetchServices}
                      onOpenChat={() => {
                        setSelectedService(service);
                        setShowChat(true);
                      }}
                    />
                  ) : (
                    <ServiceCard
                      service={service}
                      onUpdate={fetchServices}
                      isCompany
                    />
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Chat Window */}
          {showChat && selectedService && selectedService.motoboy_id && (
            <ChatWindow
              serviceId={selectedService.id}
              receiverId={selectedService.motoboy_id}
              receiverName="Motoboy"
              onClose={() => setShowChat(false)}
              minimized={false}
              onToggleMinimize={() => {}}
            />
          )}
        </section>
      </main>

      <CreateServiceDialogModern
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchServices();
          // Recalculate stats after creating new service
          if (companyProfile?.id) {
            calculateStats(companyProfile.id);
          }
        }}
      />
    </div>
  );
};

export default CompanyDashboard;