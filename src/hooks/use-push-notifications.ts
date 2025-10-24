import { useState, useEffect, useCallback } from 'react';
import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
} from '@capacitor/push-notifications';
import { useCapacitor } from './use-capacitor';

export interface PushNotificationState {
  token: string | null;
  notifications: PushNotificationSchema[];
  error: string | null;
  isRegistered: boolean;
}

/**
 * Hook para gerenciar notificações push
 * Funciona apenas em apps nativos (iOS/Android)
 */
export const usePushNotifications = () => {
  const { isNative } = useCapacitor();
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    notifications: [],
    error: null,
    isRegistered: false,
  });

  // Inicializar notificações push
  const initialize = useCallback(async () => {
    if (!isNative) {
      console.warn('Push notifications só funcionam em apps nativos');
      return;
    }

    try {
      // Verificar permissões
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setState(prev => ({
          ...prev,
          error: 'Permissão de notificações negada',
        }));
        return;
      }

      // Registrar para receber notificações
      await PushNotifications.register();
      setState(prev => ({ ...prev, isRegistered: true }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao inicializar notificações';
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [isNative]);

  // Setup de listeners
  useEffect(() => {
    if (!isNative) return;

    let registrationListener: any;
    let errorListener: any;
    let notificationListener: any;
    let actionListener: any;

    const setupListeners = async () => {
      // Listener para registro bem-sucedido
      registrationListener = await PushNotifications.addListener(
        'registration',
        (token: Token) => {
          console.log('Push registration success, token: ' + token.value);
          setState(prev => ({
            ...prev,
            token: token.value,
            error: null,
          }));
        }
      );

      // Listener para erro de registro
      errorListener = await PushNotifications.addListener(
        'registrationError',
        (error: any) => {
          console.error('Error on registration: ' + JSON.stringify(error));
          setState(prev => ({
            ...prev,
            error: 'Erro ao registrar notificações',
          }));
        }
      );

      // Listener para notificações recebidas
      notificationListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received: ', notification);
          setState(prev => ({
            ...prev,
            notifications: [...prev.notifications, notification],
          }));
        }
      );

      // Listener para ação em notificação
      actionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notification: ActionPerformed) => {
          console.log('Push notification action performed', notification);
          // Aqui você pode navegar para tela específica baseado na notificação
        }
      );
    };

    setupListeners();

    // Cleanup
    return () => {
      if (registrationListener) registrationListener.remove();
      if (errorListener) errorListener.remove();
      if (notificationListener) notificationListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [isNative]);

  // Obter notificações entregues
  const getDeliveredNotifications = useCallback(async () => {
    if (!isNative) return [];

    try {
      const notificationList = await PushNotifications.getDeliveredNotifications();
      return notificationList.notifications;
    } catch (error) {
      console.error('Erro ao obter notificações:', error);
      return [];
    }
  }, [isNative]);

  // Remover notificações entregues
  const removeDeliveredNotifications = useCallback(async (notificationIds: string[]) => {
    if (!isNative) return;

    try {
      await PushNotifications.removeDeliveredNotifications({
        notifications: notificationIds.map(id => ({ id })),
      });
    } catch (error) {
      console.error('Erro ao remover notificações:', error);
    }
  }, [isNative]);

  // Remover todas as notificações
  const removeAllDeliveredNotifications = useCallback(async () => {
    if (!isNative) return;

    try {
      await PushNotifications.removeAllDeliveredNotifications();
      setState(prev => ({
        ...prev,
        notifications: [],
      }));
    } catch (error) {
      console.error('Erro ao remover todas notificações:', error);
    }
  }, [isNative]);

  // Limpar última notificação da lista
  const clearLastNotification = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.slice(0, -1),
    }));
  }, []);

  return {
    ...state,
    initialize,
    getDeliveredNotifications,
    removeDeliveredNotifications,
    removeAllDeliveredNotifications,
    clearLastNotification,
  };
};
