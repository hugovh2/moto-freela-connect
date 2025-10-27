import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  userName: string;
  userId: string;
  onPhotoUpdated?: (newUrl: string) => void;
}

export const ProfilePhotoUpload = ({ 
  currentPhotoUrl, 
  userName, 
  userId,
  onPhotoUpdated 
}: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl);
  const [isOpen, setIsOpen] = useState(false);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande (máx 5MB)');
      return;
    }

    setUploading(true);
    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${userId}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        
        // Se bucket não existe, dar instrução clara
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('404')) {
          throw new Error(
            '❌ Bucket "avatars" não existe! ' +
            'VOCÊ PRECISA: ' +
            '1) Ir em Supabase Dashboard → Storage ' +
            '2) Clicar "New bucket" ' +
            '3) Nome: avatars ' +
            '4) Marcar "Public" ' +
            '5) Criar'
          );
        }
        
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPhotoUrl(publicUrl);

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar avatar_url:', updateError);
        throw new Error('Erro ao salvar foto no perfil');
      }

      toast.success('Foto de perfil atualizada!');
      if (onPhotoUpdated) {
        onPhotoUpdated(publicUrl);
      }
      setIsOpen(false);
    } catch (error: any) {
      console.error('Erro ao enviar foto:', error);
      toast.error(error.message || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);

      // Atualizar no banco de dados
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        throw new Error('Erro ao remover foto');
      }

      setPhotoUrl(undefined);
      toast.success('Foto de perfil removida');
      if (onPhotoUpdated) {
        onPhotoUpdated('');
      }
    } catch (error: any) {
      console.error('Erro ao remover foto:', error);
      toast.error(error.message || 'Erro ao remover foto');
    } finally {
      setUploading(false);
    }
  };

  const initials = userName?.substring(0, 2).toUpperCase() || 'U';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-lg transition-transform hover:scale-105">
            <AvatarImage src={photoUrl} alt={userName} />
            <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>
            Atualize sua foto de perfil (máx 5MB)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32 border-4 border-primary">
              <AvatarImage src={photoUrl} alt={userName} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-pink-500 text-white text-4xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher Foto
                </>
              )}
            </Button>
            
            {photoUrl && (
              <Button
                variant="destructive"
                className="w-full"
                disabled={uploading}
                onClick={handleRemovePhoto}
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            )}
          </div>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
