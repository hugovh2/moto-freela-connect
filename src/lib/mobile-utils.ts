import { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Utilitários para funcionalidades mobile
 */

/**
 * Converte uma foto do Capacitor em base64
 */
export const photoToBase64 = async (photo: Photo): Promise<string> => {
  if (photo.base64String) {
    return photo.base64String;
  }

  if (photo.webPath) {
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove o prefixo data:image/...
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  throw new Error('Não foi possível converter foto para base64');
};

/**
 * Converte uma foto do Capacitor em Blob
 */
export const photoToBlob = async (photo: Photo): Promise<Blob> => {
  if (!photo.webPath) {
    throw new Error('webPath não disponível na foto');
  }

  const response = await fetch(photo.webPath);
  return await response.blob();
};

/**
 * Converte uma foto do Capacitor em File
 */
export const photoToFile = async (photo: Photo, fileName: string = 'photo.jpg'): Promise<File> => {
  const blob = await photoToBlob(photo);
  return new File([blob], fileName, { type: photo.format ? `image/${photo.format}` : 'image/jpeg' });
};

/**
 * Verifica se o dispositivo suporta câmera
 */
export const isCameraAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Camera');
};

/**
 * Verifica se o dispositivo suporta geolocalização
 */
export const isGeolocationAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('Geolocation');
};

/**
 * Verifica se o dispositivo suporta notificações push
 */
export const isPushNotificationsAvailable = (): boolean => {
  return Capacitor.isPluginAvailable('PushNotifications');
};

/**
 * Formata coordenadas para exibição
 */
export const formatCoordinates = (lat: number, lng: number): string => {
  const latStr = lat >= 0 ? `${lat.toFixed(6)}°N` : `${Math.abs(lat).toFixed(6)}°S`;
  const lngStr = lng >= 0 ? `${lng.toFixed(6)}°E` : `${Math.abs(lng).toFixed(6)}°W`;
  return `${latStr}, ${lngStr}`;
};

/**
 * Calcula distância entre duas coordenadas (em km)
 * Usa fórmula de Haversine
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Converte graus para radianos
 */
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

/**
 * Formata distância para exibição (km ou metros)
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
};

/**
 * Compartilha conteúdo usando API nativa de compartilhamento
 */
export const shareContent = async (
  title: string,
  text: string,
  url?: string
): Promise<boolean> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
      }
      return false;
    }
  }
  return false;
};

/**
 * Abre URL em navegador externo (útil para apps)
 */
export const openExternalUrl = (url: string): void => {
  if (Capacitor.isNativePlatform()) {
    // Em apps nativos, abre no navegador do sistema
    window.open(url, '_system');
  } else {
    // Na web, abre em nova aba
    window.open(url, '_blank');
  }
};

/**
 * Copia texto para clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Erro ao copiar para clipboard:', error);
    return false;
  }
};

/**
 * Verifica se o app está rodando em modo debug
 */
export const isDebugMode = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};
