/**
 * Ride History Component
 * Histórico detalhado de corridas com filtros
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Download,
  Filter,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Ride {
  id: string;
  title: string;
  pickup_location: string;
  delivery_location: string;
  price: number;
  status: string;
  created_at: string;
  completed_at?: string;
  rating?: number;
  distance?: number;
}

interface RideHistoryProps {
  userId: string;
  userRole: 'company' | 'motoboy';
}

type DateFilter = 'today' | 'week' | 'month' | 'all';
type StatusFilter = 'all' | 'completed' | 'cancelled';

export const RideHistory = ({ userId, userRole }: RideHistoryProps) => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [stats, setStats] = useState({
    totalRides: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
  });

  useEffect(() => {
    loadRides();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [rides, dateFilter, statusFilter]);

  const loadRides = async () => {
    try {
      setIsLoading(true);

      const column = userRole === 'motoboy' ? 'motoboy_id' : 'company_id';

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRides(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('[RideHistory] Error loading rides:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rides];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter((ride) => {
        const rideDate = new Date(ride.created_at);
        return rideDate >= startDate;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((ride) => ride.status === statusFilter);
    }

    setFilteredRides(filtered);
  };

  const calculateStats = (ridesData: Ride[]) => {
    const completed = ridesData.filter((r) => r.status === 'completed');
    const totalEarnings = completed.reduce((sum, r) => sum + (r.price || 0), 0);
    const ratingsSum = completed.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = completed.length > 0 ? ratingsSum / completed.length : 0;
    const completionRate =
      ridesData.length > 0 ? (completed.length / ridesData.length) * 100 : 0;

    setStats({
      totalRides: ridesData.length,
      totalEarnings,
      averageRating,
      completionRate,
    });
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Origem', 'Destino', 'Valor', 'Status', 'Avaliação'];
    const rows = filteredRides.map((ride) => [
      format(new Date(ride.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      ride.pickup_location,
      ride.delivery_location,
      `R$ ${ride.price.toFixed(2)}`,
      ride.status,
      ride.rating ? `${ride.rating}/5` : 'N/A',
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico_corridas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', className: 'bg-green-500' },
      cancelled: { variant: 'destructive', className: '' },
      in_progress: { variant: 'default', className: 'bg-blue-500' },
      available: { variant: 'secondary', className: '' },
    };

    const config = variants[status] || { variant: 'secondary', className: '' };

    return (
      <Badge variant={config.variant} className={config.className}>
        {status === 'completed' && 'Concluída'}
        {status === 'cancelled' && 'Cancelada'}
        {status === 'in_progress' && 'Em Andamento'}
        {status === 'available' && 'Disponível'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Corridas</p>
                <p className="text-2xl font-bold">{stats.totalRides}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ganhos Totais</p>
                <p className="text-2xl font-bold">R$ {stats.totalEarnings.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Corridas</CardTitle>
              <CardDescription>
                {filteredRides.length} corrida{filteredRides.length !== 1 ? 's' : ''}{' '}
                encontrada{filteredRides.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rides List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Nenhuma corrida encontrada</p>
              </div>
            ) : (
              filteredRides.map((ride) => (
                <Card key={ride.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{ride.title}</h4>
                          {getStatusBadge(ride.status)}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{ride.pickup_location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            <span>{ride.delivery_location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(ride.created_at), "dd 'de' MMMM, HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {ride.price.toFixed(2)}
                        </p>
                        {ride.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{ride.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RideHistory;
