/**
 * Document Upload Component
 * Upload de documentos (CNH, CRLV, Foto) para verificação de identidade
 */

import { useState } from 'react';
import { Camera } from '@capacitor/camera';
import { CameraResultType, CameraSource } from '@capacitor/camera';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Camera as CameraIcon, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type DocumentType = 'cnh' | 'crlv' | 'selfie' | 'vehicle_photo';

export interface DocumentUploadProps {
  userId: string;
  documentType: DocumentType;
  onUploadComplete?: (url: string) => void;
  existingUrl?: string;
}

const documentLabels: Record<DocumentType, string> = {
  cnh: 'CNH (Carteira Nacional de Habilitação)',
  crlv: 'CRLV (Documento do Veículo)',
  selfie: 'Selfie com Documento',
  vehicle_photo: 'Foto do Veículo',
};

const documentIcons: Record<DocumentType, React.ReactNode> = {
  cnh: <FileText className="h-6 w-6" />,
  crlv: <FileText className="h-6 w-6" />,
  selfie: <CameraIcon className="h-6 w-6" />,
  vehicle_photo: <CameraIcon className="h-6 w-6" />,
};

export const DocumentUpload = ({
  userId,
  documentType,
  onUploadComplete,
  existingUrl,
}: DocumentUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl || null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleTakePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      if (image.base64String) {
        await uploadDocument(image.base64String, image.format || 'jpeg');
      }
    } catch (error) {
      console.error('[DocumentUpload] Error taking photo:', error);
      toast.error('Erro ao tirar foto. Tente novamente.');
    }
  };

  const handleSelectFile = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      if (image.base64String) {
        await uploadDocument(image.base64String, image.format || 'jpeg');
      }
    } catch (error) {
      console.error('[DocumentUpload] Error selecting file:', error);
      toast.error('Erro ao selecionar arquivo. Tente novamente.');
    }
  };

  const uploadDocument = async (base64: string, format: string) => {
    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${format}` });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `${userId}/${documentType}_${timestamp}.${format}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filename, blob, {
          contentType: `image/${format}`,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filename);

      const publicUrl = urlData.publicUrl;

      setUploadedUrl(publicUrl);
      setUploadStatus('success');
      toast.success('Documento enviado com sucesso!');

      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }
    } catch (error) {
      console.error('[DocumentUpload] Upload error:', error);
      setUploadStatus('error');
      toast.error('Erro ao enviar documento. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-2 border-dashed hover:border-primary transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            {documentIcons[documentType]}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">
                {documentLabels[documentType]}
              </Label>
              
              {uploadStatus === 'success' && (
                <Badge className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enviado
                </Badge>
              )}
              
              {uploadStatus === 'error' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
              )}
            </div>

            {uploadedUrl ? (
              <div className="space-y-3">
                <img
                  src={uploadedUrl}
                  alt={documentLabels[documentType]}
                  className="w-full h-40 object-cover rounded-lg border"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTakePhoto}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <CameraIcon className="h-4 w-4 mr-2" />
                    Tirar Nova Foto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectFile}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tire uma foto ou selecione um arquivo do seu dispositivo
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTakePhoto}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-4 w-4 mr-2" />
                        Tirar Foto
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSelectFile}
                    disabled={isUploading}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
