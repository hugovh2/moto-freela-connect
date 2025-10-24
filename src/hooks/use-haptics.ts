import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { useCapacitor } from './use-capacitor';

/**
 * Hook para feedback tátil (vibração)
 * Melhora a experiência do usuário em dispositivos móveis
 */
export const useHaptics = () => {
  const { isNative } = useCapacitor();

  // Impacto leve (ex: botão clicado)
  const light = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Impacto médio (ex: ação importante)
  const medium = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Impacto forte (ex: erro crítico)
  const heavy = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Notificação de sucesso
  const success = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Notificação de aviso
  const warning = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Notificação de erro
  const error = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Vibração de seleção
  const selection = useCallback(async () => {
    if (!isNative) return;
    try {
      await Haptics.selectionStart();
      // Pode adicionar um pequeno delay se necessário
      await new Promise(resolve => setTimeout(resolve, 50));
      await Haptics.selectionEnd();
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  // Vibrar por duração customizada (milissegundos)
  const vibrate = useCallback(async (duration: number = 100) => {
    if (!isNative) return;
    try {
      await Haptics.vibrate({ duration });
    } catch (error) {
      console.error('Erro ao executar haptic:', error);
    }
  }, [isNative]);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    vibrate,
    isAvailable: isNative,
  };
};
