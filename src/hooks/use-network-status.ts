import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';

export interface NetworkState {
  connected: boolean;
  connectionType: string;
  status: ConnectionStatus | null;
}

/**
 * Hook para monitorar o status da conexão de rede
 */
export const useNetworkStatus = () => {
  const [state, setState] = useState<NetworkState>({
    connected: true,
    connectionType: 'unknown',
    status: null,
  });

  useEffect(() => {
    let handler: any;

    const setupNetwork = async () => {
      // Obter status inicial
      try {
        const status = await Network.getStatus();
        setState({
          connected: status.connected,
          connectionType: status.connectionType,
          status,
        });
      } catch (error) {
        console.error('Erro ao obter status de rede:', error);
      }

      // Listener para mudanças no status
      handler = await Network.addListener('networkStatusChange', (status) => {
        console.log('Network status changed', status);
        setState({
          connected: status.connected,
          connectionType: status.connectionType,
          status,
        });
      });
    };

    setupNetwork();

    // Cleanup
    return () => {
      if (handler) handler.remove();
    };
  }, []);

  return state;
};
