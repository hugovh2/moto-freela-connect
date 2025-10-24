import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed?: number;
  heading?: number;
  timestamp: number;
}

interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number; // milliseconds
}

export const useLocationTracking = (
  serviceId?: string,
  options: LocationTrackingOptions = {}
) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    updateInterval = 5000, // 5 seconds
  } = options;

  // Update location in database
  const updateLocationInDatabase = useCallback(async (location: LocationData) => {
    try {
      const { error } = await supabase.rpc('update_user_location', {
        p_lat: location.latitude,
        p_lng: location.longitude,
        p_accuracy: location.accuracy,
        p_speed: location.speed || null,
        p_heading: location.heading || null,
        p_service_id: serviceId || null,
      });

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }
    } catch (err: any) {
      console.error('Database location update failed:', err);
      setError(err.message);
    }
  }, [serviceId]);

  // Handle position update
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined,
      timestamp: position.timestamp,
    };

    setCurrentLocation(locationData);
    setError(null);

    // Update database if tracking is active
    if (isTracking) {
      updateLocationInDatabase(locationData);
    }
  }, [isTracking, updateLocationInDatabase]);

  // Handle geolocation error
  const handlePositionError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Erro de geolocalização';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permissão de localização negada';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Localização indisponível';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout ao obter localização';
        break;
    }

    setError(errorMessage);
    console.error('Geolocation error:', errorMessage, error);
  }, []);

  // Start tracking location
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return false;
    }

    if (isTracking) {
      return true; // Already tracking
    }

    const watchOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    try {
      const id = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        watchOptions
      );

      setWatchId(id);
      setIsTracking(true);
      setError(null);

      // Also get immediate position
      navigator.geolocation.getCurrentPosition(
        handlePositionUpdate,
        handlePositionError,
        watchOptions
      );

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [
    isTracking,
    enableHighAccuracy,
    timeout,
    maximumAge,
    handlePositionUpdate,
    handlePositionError,
  ]);

  // Stop tracking location
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Get current position once (without tracking)
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada');
      return Promise.reject(new Error('Geolocalização não suportada'));
    }

    return new Promise<LocationData>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: position.timestamp,
          };
          setCurrentLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          handlePositionError(error);
          reject(error);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    });
  }, [enableHighAccuracy, timeout, maximumAge, handlePositionError]);

  // Set availability status
  const setAvailabilityStatus = useCallback(async (available: boolean) => {
    try {
      const { error } = await supabase.rpc('set_availability_status', {
        p_available: available,
      });

      if (error) throw error;

      // Start/stop tracking based on availability
      if (available && !isTracking) {
        startTracking();
      } else if (!available && isTracking) {
        stopTracking();
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error('Erro ao atualizar status');
      return false;
    }
  }, [isTracking, startTracking, stopTracking]);

  // Get nearby services
  const getNearbyServices = useCallback(async (radiusKm: number = 10) => {
    if (!currentLocation) {
      throw new Error('Localização atual não disponível');
    }

    try {
      const { data, error } = await supabase.rpc('get_nearby_services', {
        p_lat: currentLocation.latitude,
        p_lng: currentLocation.longitude,
        p_radius_km: radiusKm,
      });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [currentLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    // State
    isTracking,
    currentLocation,
    error,

    // Actions
    startTracking,
    stopTracking,
    getCurrentPosition,
    setAvailabilityStatus,
    getNearbyServices,

    // Derived state
    hasLocation: !!currentLocation,
    isLocationRecent: currentLocation ? 
      (Date.now() - currentLocation.timestamp) < 60000 : false, // within 1 minute
  };
};

export default useLocationTracking;
