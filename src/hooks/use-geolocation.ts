import { useState, useEffect, useCallback } from 'react';
import { Geolocation, Position, PositionOptions } from '@capacitor/geolocation';

export interface GeolocationState {
  position: Position | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook para acessar a geolocalização do dispositivo
 * Funciona tanto em web quanto em apps nativos
 */
export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });
  const [watchId, setWatchId] = useState<string | null>(null);

  // Obter posição atual
  const getCurrentPosition = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      });

      setState({
        position,
        error: null,
        loading: false,
      });

      return position;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao obter localização';
      setState({
        position: null,
        error: errorMessage,
        loading: false,
      });
      throw error;
    }
  }, [options]);

  // Iniciar rastreamento contínuo
  const startWatching = useCallback(async () => {
    try {
      const id = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
          ...options,
        },
        (position, error) => {
          if (error) {
            setState(prev => ({
              ...prev,
              error: error.message,
            }));
          } else if (position) {
            setState({
              position,
              error: null,
              loading: false,
            });
          }
        }
      );

      setWatchId(id);
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar rastreamento';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      throw error;
    }
  }, [options]);

  // Parar rastreamento
  const stopWatching = useCallback(async () => {
    if (watchId) {
      await Geolocation.clearWatch({ id: watchId });
      setWatchId(null);
    }
  }, [watchId]);

  // Verificar permissões
  const checkPermissions = useCallback(async () => {
    try {
      const result = await Geolocation.checkPermissions();
      return result.location;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return 'denied';
    }
  }, []);

  // Solicitar permissões
  const requestPermissions = useCallback(async () => {
    try {
      const result = await Geolocation.requestPermissions();
      return result.location;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return 'denied';
    }
  }, []);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    checkPermissions,
    requestPermissions,
    isWatching: watchId !== null,
  };
};
