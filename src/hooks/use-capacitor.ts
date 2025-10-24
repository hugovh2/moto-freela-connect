import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface CapacitorPlatform {
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  platform: string;
}

/**
 * Hook para detectar se o app está rodando em ambiente nativo
 * e qual plataforma está sendo usada
 */
export const useCapacitor = (): CapacitorPlatform => {
  const [platform, setPlatform] = useState<CapacitorPlatform>({
    isNative: Capacitor.isNativePlatform(),
    isAndroid: Capacitor.getPlatform() === 'android',
    isIOS: Capacitor.getPlatform() === 'ios',
    isWeb: Capacitor.getPlatform() === 'web',
    platform: Capacitor.getPlatform(),
  });

  useEffect(() => {
    // Atualizar informações da plataforma
    setPlatform({
      isNative: Capacitor.isNativePlatform(),
      isAndroid: Capacitor.getPlatform() === 'android',
      isIOS: Capacitor.getPlatform() === 'ios',
      isWeb: Capacitor.getPlatform() === 'web',
      platform: Capacitor.getPlatform(),
    });
  }, []);

  return platform;
};
