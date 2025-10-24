import { useState, useEffect } from 'react';
import { App, AppState } from '@capacitor/app';
import { useCapacitor } from './use-capacitor';

/**
 * Hook para monitorar o estado do app (ativo/background)
 * Útil para pausar rastreamento GPS quando app está em background
 */
export const useAppState = () => {
  const { isNative } = useCapacitor();
  const [isActive, setIsActive] = useState(true);
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    if (!isNative) return;

    let listener: any;
    let resumeListener: any;
    let pauseListener: any;

    const setupListeners = async () => {
      // Listener para mudanças de estado
      listener = await App.addListener('appStateChange', (state) => {
        console.log('App state changed. Is active?', state.isActive);
        setIsActive(state.isActive);
        setState(state);
      });

      // Listener para quando app volta do background
      resumeListener = await App.addListener('resume', () => {
        console.log('App resumed');
        setIsActive(true);
      });

      // Listener para quando app vai para background
      pauseListener = await App.addListener('pause', () => {
        console.log('App paused');
        setIsActive(false);
      });
    };

    setupListeners();

    // Cleanup
    return () => {
      if (listener) listener.remove();
      if (resumeListener) resumeListener.remove();
      if (pauseListener) pauseListener.remove();
    };
  }, [isNative]);

  return {
    isActive,
    state,
    isNative,
  };
};
