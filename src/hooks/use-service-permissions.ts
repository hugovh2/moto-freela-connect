import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getUserRole } from '@/lib/supabase-client';

export const useServicePermissions = () => {
  const [userRole, setUserRole] = useState<'motoboy' | 'company' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          
          // Use the robust getUserRole function
          const role = await getUserRole(user.id);
          if (role) {
            setUserRole(role as 'motoboy' | 'company');
          } else {
            // Fallback to motoboy if no role found
            setUserRole('motoboy');
          }
        }
      } catch (error) {
        console.error('[useServicePermissions] Error getting user:', error);
        // Set default role to prevent system breakage
        setUserRole('motoboy');
      }
    };

    getUser();
  }, []);

  const canUpdateService = (service: any): boolean => {
    if (!userId || !userRole) return false;

    // Company can update their own services
    if (userRole === 'company' && service.company_id === userId) {
      return true;
    }

    // Motoboy can update services they're assigned to
    if (userRole === 'motoboy') {
      // Can accept available services
      if (service.status === 'available' && !service.motoboy_id) {
        return true;
      }
      // Can update services assigned to them
      if (service.motoboy_id === userId) {
        return true;
      }
    }

    return false;
  };

  const canAcceptService = (service: any): boolean => {
    const canAccept = (
      userRole === 'motoboy' && 
      service.status === 'available' && 
      !service.motoboy_id
    );
    
    console.log('[useServicePermissions] canAcceptService:', {
      userRole,
      serviceStatus: service.status,
      hasMotoboyId: !!service.motoboy_id,
      canAccept
    });
    
    return canAccept;
  };

  return {
    userRole,
    userId,
    canUpdateService,
    canAcceptService,
  };
};
