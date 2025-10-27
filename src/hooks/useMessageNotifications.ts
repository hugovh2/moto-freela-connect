import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';

interface UseMessageNotificationsProps {
  userId: string;
  onNewMessage?: (message: any) => void;
}

export const useMessageNotifications = ({ userId, onNewMessage }: UseMessageNotificationsProps) => {
  useEffect(() => {
    if (!userId) return;

    console.log('[MessageNotifications] Configurando notificações para:', userId);

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[MessageNotifications] Nova mensagem recebida:', payload);
          
          const newMessage = payload.new as any;
          
          // Buscar informações do remetente
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.full_name || 'Usuário';
          
          // Mostrar notificação toast
          toast.success(
            `💬 ${senderName}: ${newMessage.content}`,
            {
              duration: 5000,
              position: 'top-right',
              description: 'Nova mensagem recebida',
            }
          );

          // Tentar reproduzir som de notificação
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(err => console.log('Erro ao reproduzir som:', err));
          } catch (error) {
            console.log('Som de notificação não disponível');
          }

          // Callback personalizado
          if (onNewMessage) {
            onNewMessage(newMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log('[MessageNotifications] Status da subscription:', status);
      });

    // Cleanup
    return () => {
      console.log('[MessageNotifications] Removendo subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, onNewMessage]);
};
