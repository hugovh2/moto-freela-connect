import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useServicePermissions = () => {
  const [userRole, setUserRole] = useState<'motoboy' | 'company' | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Get user role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
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
    return (
      userRole === 'motoboy' && 
      service.status === 'available' && 
      !service.motoboy_id
    );
  };

  return {
    userRole,
    userId,
    canUpdateService,
    canAcceptService,
  };
};
