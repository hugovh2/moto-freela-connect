import { useEffect } from 'react';
import { usePushNotifications } from './use-push-notifications';
import { useHaptics } from './use-haptics';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ServiceNotification {
  id: string;
  title: string;
  body: string;
  type: 'new_service' | 'service_accepted' | 'service_completed' | 'message' | 'status_update';
  serviceId?: string;
  userId?: string;
  data?: any;
}

export const useServiceNotifications = (userType: 'motoboy' | 'company') => {
  const { notifications, initialize: initializePush } = usePushNotifications();
  const haptics = useHaptics();

  // Initialize push notifications
  useEffect(() => {
    initializePush();
  }, []);

  // Listen for real-time updates via Supabase
  useEffect(() => {
    const setupRealtimeListeners = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Listen for service updates
      const serviceChannel = supabase
        .channel('service_updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'services',
            filter: userType === 'company' ? `company_id=eq.${user.id}` : `motoboy_id=eq.${user.id}`
          },
          (payload) => {
            handleServiceUpdate(payload);
          }
        )
        .subscribe();

      // Listen for new services (for motoboys)
      let newServiceChannel;
      if (userType === 'motoboy') {
        newServiceChannel = supabase
          .channel('new_services')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'services'
            },
            (payload) => {
              handleNewService(payload);
            }
          )
          .subscribe();
      }

      return () => {
        serviceChannel.unsubscribe();
        if (newServiceChannel) newServiceChannel.unsubscribe();
      };
    };

    setupRealtimeListeners();
  }, [userType]);

  const handleServiceUpdate = (payload: any) => {
    const service = payload.new;
    const oldService = payload.old;

    // Check if status changed
    if (service.status !== oldService.status) {
      haptics.medium();
      
      const statusMessages = {
        accepted: {
          title: 'Corrida Aceita!',
          body: `Motoboy aceitou sua corrida ${service.title}`,
          icon: '✅'
        },
        collected: {
          title: 'Item Coletado',
          body: `Seu pedido foi coletado e está a caminho`,
          icon: '📦'
        },
        in_progress: {
          title: 'Em Entrega',
          body: `Sua entrega está a caminho do destino`,
          icon: '🏍️'
        },
        completed: {
          title: 'Entrega Concluída!',
          body: `Sua entrega foi finalizada com sucesso`,
          icon: '🎉'
        }
      };

      const statusInfo = statusMessages[service.status as keyof typeof statusMessages];
      
      if (statusInfo) {
        toast.success(`${statusInfo.icon} ${statusInfo.title}`, {
          description: statusInfo.body,
          duration: 5000,
        });

        // Send local notification if app is in background
        if ('serviceWorker' in navigator && 'Notification' in window) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(statusInfo.title, {
              body: statusInfo.body,
              icon: '/icon.png',
              badge: '/badge.png',
              tag: `service-${service.id}`,
              data: {
                serviceId: service.id,
                type: 'status_update'
              }
            });
          });
        }
      }
    }
  };

  const handleNewService = async (payload: any) => {
    const service = payload.new;
    
    // Only notify if motoboy is available and service is nearby
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // For now, we'll skip the availability check since the columns don't exist yet
    // In a real app, you'd need to add these columns to the profiles table
    const profile = { available: true, last_location_lat: -23.5505, last_location_lng: -46.6333 };
    
    if (!profile?.available) return;

    // Calculate distance (simplified - you might want to use Google Maps Distance Matrix API)
    const distance = calculateDistance(
      profile.last_location_lat,
      profile.last_location_lng,
      service.pickup_lat || service.origem_lat,
      service.pickup_lng || service.origem_lng
    );

    // Only notify if within 10km
    if (distance <= 10) {
      haptics.heavy();
      
      toast.success('🏍️ Nova Corrida Próxima!', {
        description: `${service.service_type} - R$ ${service.price} - ${distance.toFixed(1)}km`,
        duration: 8000,
        action: {
          label: 'Ver Detalhes',
          onClick: () => {
            // Navigate to service details
            window.location.href = `/service/${service.id}`;
          }
        }
      });

      // Send push notification
      if ('serviceWorker' in navigator && 'Notification' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification('Nova Corrida Disponível!', {
            body: `${service.service_type} - R$ ${service.price?.toFixed(2)} - ${distance.toFixed(1)}km de distância`,
            icon: '/icon.png',
            badge: '/badge.png',
            tag: `new-service-${service.id}`,
            // vibrate: [200, 100, 200], // Vibrate not available in web notifications
            data: {
              serviceId: service.id,
              type: 'new_service'
            },
            // actions: [ // Actions not supported in all browsers
            //   {
            //     action: 'view',
            //     title: 'Ver Detalhes'
            //   },
            //   {
            //     action: 'accept',
            //     title: 'Aceitar'
            //   }
            // ]
          });
        });
      }
    }
  };

  // Utility function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const sendNotificationToUser = async (
    userId: string, 
    title: string, 
    body: string, 
    data?: any
  ) => {
    try {
      // For now, just show a toast notification
      // In a real app, you'd send this through your backend to FCM
      toast.success(title, {
        description: body,
        duration: 5000,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  return {
    notifications,
    sendNotificationToUser,
  };
};
