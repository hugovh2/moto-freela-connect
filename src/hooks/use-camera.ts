import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';

export interface CameraState {
  photo: Photo | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para acessar a câmera do dispositivo
 * Permite tirar fotos e selecionar da galeria
 */
export const useCamera = () => {
  const [state, setState] = useState<CameraState>({
    photo: null,
    loading: false,
    error: null,
  });

  // Tirar foto com a câmera
  const takePicture = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      setState({
        photo,
        loading: false,
        error: null,
      });

      return photo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao tirar foto';
      setState({
        photo: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  // Selecionar foto da galeria
  const pickFromGallery = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      setState({
        photo,
        loading: false,
        error: null,
      });

      return photo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao selecionar foto';
      setState({
        photo: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  // Selecionar múltiplas fotos (Android/iOS)
  const pickMultiple = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Note: pickImages requer plugin adicional ou implementação customizada
      // Por enquanto, retorna single photo
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      });

      setState({
        photo,
        loading: false,
        error: null,
      });

      return [photo];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao selecionar fotos';
      setState({
        photo: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, []);

  // Verificar permissões
  const checkPermissions = useCallback(async () => {
    try {
      const result = await Camera.checkPermissions();
      return result;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }, []);

  // Solicitar permissões
  const requestPermissions = useCallback(async () => {
    try {
      const result = await Camera.requestPermissions();
      return result;
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }, []);

  // Limpar foto atual
  const clearPhoto = useCallback(() => {
    setState({
      photo: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    takePicture,
    pickFromGallery,
    pickMultiple,
    checkPermissions,
    requestPermissions,
    clearPhoto,
  };
};
