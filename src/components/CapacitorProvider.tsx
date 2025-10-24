import { useEffect, ReactNode } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useCapacitor } from '@/hooks/use-capacitor';

interface CapacitorProviderProps {
  children: ReactNode;
}

/**
 * Provider que inicializa configurações nativas do Capacitor
 * Deve envolver toda a aplicação no App.tsx
 */
export const CapacitorProvider = ({ children }: CapacitorProviderProps) => {
  const { isNative, isAndroid, isIOS } = useCapacitor();

  useEffect(() => {
    if (!isNative) return;

    const initializeApp = async () => {
      try {
        // Configurar status bar
        if (isAndroid) {
          await StatusBar.setBackgroundColor({ color: '#FF6B35' });
          await StatusBar.setStyle({ style: Style.Dark });
        } else if (isIOS) {
          await StatusBar.setStyle({ style: Style.Light });
        }

        // Esconder splash screen após app estar pronto
        await SplashScreen.hide();
        
        console.log('App nativo inicializado com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar app nativo:', error);
      }
    };

    initializeApp();
  }, [isNative, isAndroid, isIOS]);

  return <>{children}</>;
};
